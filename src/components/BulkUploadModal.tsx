'use client';

import { useState, useCallback, useRef } from 'react';

interface UploadResult {
  filename: string;
  status: 'success' | 'error';
  fileId?: number;
  recordId?: number;
  error?: string;
}

interface BulkUploadModalProps {
  clientId: number;
  workflowKey: string;
  workflowName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({
  clientId,
  workflowKey,
  workflowName,
  onClose,
  onSuccess
}: BulkUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const allowedTypes = ['application/pdf', 'image/tiff', 'image/png', 'image/jpeg', 'image/jpg'];
    const validFiles = newFiles.filter(f => 
      allowedTypes.includes(f.type) || 
      f.name.endsWith('.pdf') || 
      f.name.endsWith('.tiff') || 
      f.name.endsWith('.tif') ||
      f.name.endsWith('.png') ||
      f.name.endsWith('.jpg') ||
      f.name.endsWith('.jpeg')
    );

    const existingNames = new Set(files.map(f => f.name));
    const uniqueNewFiles = validFiles.filter(f => !existingNames.has(f.name));

    setFiles(prev => [...prev, ...uniqueNewFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('clientId', clientId.toString());
      formData.append('workflowKey', workflowKey);
      
      for (const file of files) {
        formData.append('files', file);
      }

      const response = await fetch('/api/intake/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        if (data.summary.failed === 0) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setResults([{
          filename: 'Upload',
          status: 'error',
          error: data.error || 'Upload failed'
        }]);
      }
    } catch (error) {
      setResults([{
        filename: 'Upload',
        status: 'error',
        error: 'Upload failed'
      }]);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>Bulk Upload</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Upload multiple files to {workflowName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
            <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
          {!results ? (
            <>
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#6366f1' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '48px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragActive ? '#f5f3ff' : 'white',
                  transition: 'all 0.15s'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.tiff,.tif,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <svg width="48" height="48" fill="none" stroke={dragActive ? '#6366f1' : '#cbd5e1'} strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 16px' }}>
                  <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#0f172a', marginBottom: '8px' }}>
                  Drop files here or click to browse
                </p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  Supports PDF, TIFF, PNG, JPG files
                </p>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                      Selected Files ({files.length})
                    </span>
                    <button
                      onClick={() => setFiles([])}
                      style={{ fontSize: '13px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="20" height="20" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </p>
                            <p style={{ fontSize: '12px', color: '#64748b' }}>{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          <svg width="16" height="16" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results */
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px', 
                background: results.every(r => r.status === 'success') ? '#f0fdf4' : '#fef2f2',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <svg width="32" height="32" fill="none" stroke={results.every(r => r.status === 'success') ? '#16a34a' : '#f59e0b'} strokeWidth="2" viewBox="0 0 24 24">
                  {results.every(r => r.status === 'success') ? (
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  ) : (
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  )}
                </svg>
                <div>
                  <p style={{ fontWeight: 600, color: '#0f172a' }}>
                    {results.every(r => r.status === 'success') ? 'Upload Complete!' : 'Upload Complete with Errors'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>
                    {results.filter(r => r.status === 'success').length} succeeded, {results.filter(r => r.status === 'error').length} failed
                  </p>
                </div>
              </div>

              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: result.status === 'success' ? '#f0fdf4' : '#fef2f2',
                      borderRadius: '8px',
                      marginBottom: '8px'
                    }}
                  >
                    <svg width="20" height="20" fill="none" stroke={result.status === 'success' ? '#16a34a' : '#dc2626'} strokeWidth="2" viewBox="0 0 24 24">
                      {result.status === 'success' ? (
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      ) : (
                        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      )}
                    </svg>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{result.filename}</p>
                      {result.error && (
                        <p style={{ fontSize: '12px', color: '#dc2626' }}>{result.error}</p>
                      )}
                      {result.recordId && (
                        <p style={{ fontSize: '12px', color: '#16a34a' }}>Created record #{result.recordId}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {!results ? (
            <>
              <button
                onClick={onClose}
                style={{ padding: '10px 20px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  background: files.length === 0 || uploading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    Upload {files.length} File{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setFiles([]);
                  setResults(null);
                }}
                style={{ padding: '10px 20px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
              >
                Upload More
              </button>
              <button
                onClick={onSuccess}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
