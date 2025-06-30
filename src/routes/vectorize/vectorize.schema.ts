import { z } from 'zod';

export const vectorizeRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  chunking: z.object({
    enabled: z.boolean().default(false),
    strategy: z.enum(['character', 'recursive', 'token', 'simple']).default('recursive'),
    chunkSize: z.number().min(100).max(4000).default(1000),
    chunkOverlap: z.number().min(0).max(500).default(200),
    separators: z.array(z.string()).optional()
  }).optional()
});

export const vectorizeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    chunks: z.array(z.object({
      id: z.string(),
      content: z.string(),
      embedding: z.array(z.number()),
      metadata: z.object({
        chunkIndex: z.number(),
        totalChunks: z.number(),
        startIndex: z.number(),
        endIndex: z.number()
      })
    })).optional(),
    embedding: z.array(z.number()).optional(),
    vectorsStored: z.number()
  })
});

export const vectorizeErrorSchema = z.object({
  success: z.boolean().default(false),
  error: z.string()
});

export type VectorizeRequest = z.infer<typeof vectorizeRequestSchema>;
export type VectorizeResponse = z.infer<typeof vectorizeResponseSchema>;
export type VectorizeError = z.infer<typeof vectorizeErrorSchema>;