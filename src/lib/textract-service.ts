/**
 * Textract Service
 * Handles PDF extraction using AWS Textract Async API
 * 
 * Flow: PDF → S3 → Textract Async → Poll → OCR Text
 */

import { 
  TextractClient, 
  StartDocumentAnalysisCommand, 
  GetDocumentAnalysisCommand,
  FeatureType,
  Block
} from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize clients
const textractClient = new TextractClient({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const S3_BUCKET = process.env.TEXTRACT_S3_BUCKET || process.env.S3_BUCKET || 'dokit-documents';

/**
 * Upload file to S3 for Textract processing
 */
export async function uploadToS3(
  fileBuffer: Buffer, 
  filename: string, 
  mimeType: string
): Promise<string> {
  const key = `textract-temp/${uuidv4()}-${filename}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));
  
  console.log(`[Textract] Uploaded to S3: ${key}`);
  return key;
}

/**
 * Delete temporary file from S3 after processing
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
    console.log(`[Textract] Deleted from S3: ${key}`);
  } catch (error) {
    console.error(`[Textract] Failed to delete ${key}:`, error);
  }
}

/**
 * Start async Textract document analysis
 */
export async function startTextractAnalysis(s3Key: string): Promise<string> {
  const response = await textractClient.send(new StartDocumentAnalysisCommand({
    DocumentLocation: {
      S3Object: {
        Bucket: S3_BUCKET,
        Name: s3Key,
      },
    },
    FeatureTypes: [FeatureType.FORMS, FeatureType.TABLES],
  }));
  
  if (!response.JobId) {
    throw new Error('Textract did not return a JobId');
  }
  
  console.log(`[Textract] Started job: ${response.JobId}`);
  return response.JobId;
}

/**
 * Poll Textract for job completion and get results
 */
export async function waitForTextractCompletion(
  jobId: string, 
  maxWaitSeconds: number = 120
): Promise<Block[]> {
  const startTime = Date.now();
  const pollIntervalMs = 2000; // 2 seconds between polls
  
  while (true) {
    // Check timeout
    if (Date.now() - startTime > maxWaitSeconds * 1000) {
      throw new Error(`Textract job timed out after ${maxWaitSeconds} seconds`);
    }
    
    const response = await textractClient.send(new GetDocumentAnalysisCommand({
      JobId: jobId,
    }));
    
    const status = response.JobStatus;
    console.log(`[Textract] Job ${jobId} status: ${status}`);
    
    if (status === 'SUCCEEDED') {
      // Get all blocks (may need pagination for large docs)
      const blocks: Block[] = response.Blocks || [];
      
      // Handle pagination if needed
      let nextToken = response.NextToken;
      while (nextToken) {
        const nextResponse = await textractClient.send(new GetDocumentAnalysisCommand({
          JobId: jobId,
          NextToken: nextToken,
        }));
        blocks.push(...(nextResponse.Blocks || []));
        nextToken = nextResponse.NextToken;
      }
      
      return blocks;
    } else if (status === 'FAILED') {
      throw new Error(`Textract job failed: ${response.StatusMessage}`);
    } else if (status === 'PARTIAL_SUCCESS') {
      console.warn('[Textract] Partial success - some pages may have failed');
      return response.Blocks || [];
    }
    
    // Still IN_PROGRESS, wait and poll again
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
}

/**
 * Extract text from Textract blocks
 */
export function extractTextFromBlocks(blocks: Block[]): string {
  const lines: string[] = [];
  
  for (const block of blocks) {
    if (block.BlockType === 'LINE' && block.Text) {
      lines.push(block.Text);
    }
  }
  
  return lines.join('\n');
}

/**
 * Extract form key-value pairs from Textract blocks
 */
export function extractKeyValuePairs(blocks: Block[]): Record<string, string> {
  const keyMap: Record<string, Block> = {};
  const valueMap: Record<string, Block> = {};
  const blockMap: Record<string, Block> = {};
  
  // Build maps
  for (const block of blocks) {
    if (block.Id) {
      blockMap[block.Id] = block;
    }
    if (block.BlockType === 'KEY_VALUE_SET') {
      if (block.EntityTypes?.includes('KEY')) {
        keyMap[block.Id!] = block;
      } else if (block.EntityTypes?.includes('VALUE')) {
        valueMap[block.Id!] = block;
      }
    }
  }
  
  // Extract pairs
  const pairs: Record<string, string> = {};
  
  for (const keyId in keyMap) {
    const keyBlock = keyMap[keyId];
    const valueId = keyBlock.Relationships?.find(r => r.Type === 'VALUE')?.Ids?.[0];
    
    if (valueId && valueMap[valueId]) {
      const keyText = getTextFromBlock(keyBlock, blockMap);
      const valueText = getTextFromBlock(valueMap[valueId], blockMap);
      
      if (keyText && valueText) {
        pairs[keyText] = valueText;
      }
    }
  }
  
  return pairs;
}

/**
 * Get text content from a block by following child relationships
 */
function getTextFromBlock(block: Block, blockMap: Record<string, Block>): string {
  if (block.Text) return block.Text;
  
  const childIds = block.Relationships?.find(r => r.Type === 'CHILD')?.Ids || [];
  const texts: string[] = [];
  
  for (const childId of childIds) {
    const child = blockMap[childId];
    if (child?.Text) {
      texts.push(child.Text);
    }
  }
  
  return texts.join(' ');
}

/**
 * Extract table data from Textract blocks
 */
export function extractTables(blocks: Block[]): string[][] {
  const blockMap: Record<string, Block> = {};
  const tables: string[][] = [];
  
  for (const block of blocks) {
    if (block.Id) blockMap[block.Id] = block;
  }
  
  for (const block of blocks) {
    if (block.BlockType === 'TABLE') {
      const rows: Map<number, Map<number, string>> = new Map();
      
      const cellIds = block.Relationships?.find(r => r.Type === 'CHILD')?.Ids || [];
      for (const cellId of cellIds) {
        const cell = blockMap[cellId];
        if (cell?.BlockType === 'CELL' && cell.RowIndex && cell.ColumnIndex) {
          if (!rows.has(cell.RowIndex)) {
            rows.set(cell.RowIndex, new Map());
          }
          rows.get(cell.RowIndex)!.set(cell.ColumnIndex, getTextFromBlock(cell, blockMap));
        }
      }
      
      // Convert to array
      const sortedRows = Array.from(rows.keys()).sort((a, b) => a - b);
      for (const rowIdx of sortedRows) {
        const row = rows.get(rowIdx)!;
        const sortedCols = Array.from(row.keys()).sort((a, b) => a - b);
        tables.push(sortedCols.map(col => row.get(col) || ''));
      }
    }
  }
  
  return tables;
}

/**
 * Full extraction pipeline for PDFs
 */
export async function extractTextFromPdf(
  fileBuffer: Buffer, 
  filename: string
): Promise<{
  text: string;
  keyValuePairs: Record<string, string>;
  tables: string[][];
}> {
  let s3Key: string | null = null;
  
  try {
    // 1. Upload to S3
    s3Key = await uploadToS3(fileBuffer, filename, 'application/pdf');
    
    // 2. Start Textract async job
    const jobId = await startTextractAnalysis(s3Key);
    
    // 3. Wait for completion and get blocks
    const blocks = await waitForTextractCompletion(jobId);
    
    // 4. Extract text, key-value pairs, and tables
    const text = extractTextFromBlocks(blocks);
    const keyValuePairs = extractKeyValuePairs(blocks);
    const tables = extractTables(blocks);
    
    console.log(`[Textract] Extracted ${text.length} chars, ${Object.keys(keyValuePairs).length} KV pairs, ${tables.length} table rows`);
    
    return { text, keyValuePairs, tables };
    
  } finally {
    // 5. Clean up S3
    if (s3Key) {
      await deleteFromS3(s3Key);
    }
  }
}
