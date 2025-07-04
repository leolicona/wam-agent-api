// Cloudflare Workers environment bindings
// This file defines TypeScript types for environment variables and Cloudflare services

export interface Env {

  GEMINI_API_KEY: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: string;
  // Environment variables
  AUTH_SERVICE: Fetcher;
  JWT_SECRET: string;
  OTPLESS_CLIENT_ID: string;
  OTPLESS_CLIENT_SECRET: string;
  OTPLESS_API_URL: string;
  
  // Cloudflare KV namespace for session storage
  AUTH_KV: KVNamespace;
  
  // Cloudflare D1 database for user data
  DB: D1Database;
  
  // Optional: R2 bucket for file storage
  ASSETS_BUCKET?: R2Bucket;
  
  // Optional: Analytics Engine for tracking
  ANALYTICS?: AnalyticsEngineDataset;
  
  // Optional: Queue for background tasks
  AUTH_QUEUE?: Queue;
}

// Extend the Hono Context type to include our environment
declare module 'hono' {
  interface ContextVariableMap {
    env: Env;
  }
}