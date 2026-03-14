/**
 * Next.js Instrumentation
 * 
 * This file runs once when the server starts.
 */

export async function register() {
  console.log('[INSTRUMENTATION] Server started');
  console.log('[INSTRUMENTATION] NEXT_RUNTIME:', process.env.NEXT_RUNTIME);
  console.log('[INSTRUMENTATION] NODE_ENV:', process.env.NODE_ENV);
}
