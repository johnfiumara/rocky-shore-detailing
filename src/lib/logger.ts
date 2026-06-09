/**
 * Centralized logging utility with environment-aware behavior
 * - Server-side: Always logs errors with context
 * - Client-side (dev): Logs to console for debugging
 * - Client-side (prod): Suppresses logs
 */

export const logger = {
  error: (context: string, message: string, err?: unknown) => {
    const isServer = typeof window === 'undefined';
    const errorDetails = err instanceof Error ? err.message : String(err);
    
    if (isServer) {
      // Always log on server with structured format
      console.error(`[${context}] ${message}`, {
        error: errorDetails,
        timestamp: new Date().toISOString(),
      });
    } else if (process.env.NODE_ENV === 'development') {
      // Only log in development on client
      console.error(`[${context}] ${message}`, err);
    }
    // Production client: suppress all logs
  },

  warn: (context: string, message: string) => {
    const isServer = typeof window === 'undefined';
    
    if (isServer || process.env.NODE_ENV === 'development') {
      console.warn(`[${context}] ${message}`, {
        timestamp: new Date().toISOString(),
      });
    }
  },

  info: (context: string, message: string) => {
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Only log info on server-side
      console.log(`[${context}] ${message}`);
    }
  },
};
