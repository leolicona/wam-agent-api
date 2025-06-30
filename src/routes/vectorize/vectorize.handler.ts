import { Context } from 'hono';
import { embeddings } from '../../core/embeddings/embeddings.service';
import { textSplitter } from '../../core/text-splitter';
import { VectorizeRequest } from './vectorize.schema';

export const vectorizeData = async (c: Context) => {
  console.log('Starting vectorization process');
  try {
    console.log('Attempting to parse request body');
    const requestBody: VectorizeRequest = await c.req.json();
    const { text, chunking } = requestBody;
    console.log('Received text length:', text.length);
    console.log('Chunking options:', chunking);

    if (!text) {
      console.log('No text provided in request');
      return c.json({ success: false, error: 'Text is required' }, 400);
    }
    
    console.log('Initializing embedding service with API keys');
    const embeddingService = embeddings({ apiKey: c.env.GEMINI_API_KEY, vectorize: c.env.VECTORIZE });
    const splitterService = textSplitter();
    
    let vectorsToStore: Array<{ id: string; values: number[]; metadata?: any }> = [];
    let responseData: any = {};
    
    if (chunking?.enabled) {
      console.log('Text chunking enabled with strategy:', chunking.strategy);
      
      // Split text based on strategy
      let splitResult;
      switch (chunking.strategy) {
        case 'character':
          splitResult = await splitterService.characterSplit(text, {
            chunkSize: chunking.chunkSize,
            chunkOverlap: chunking.chunkOverlap,
            separators: chunking.separators
          });
          break;
        case 'token':
          splitResult = await splitterService.tokenSplit(text, {
            chunkSize: chunking.chunkSize,
            chunkOverlap: chunking.chunkOverlap
          });
          break;
        case 'simple':
          splitResult = splitterService.simpleSplit(text, chunking.chunkSize);
          break;
        case 'recursive':
        default:
          splitResult = await splitterService.recursiveSplit(text, {
            chunkSize: chunking.chunkSize,
            chunkOverlap: chunking.chunkOverlap,
            separators: chunking.separators
          });
          break;
      }
      
      console.log(`Text split into ${splitResult.totalChunks} chunks`);
      
      // Create embeddings for each chunk
      const chunksWithEmbeddings = [];
      for (let i = 0; i < splitResult.chunks.length; i++) {
        const chunk = splitResult.chunks[i];
        console.log(`Creating embedding for chunk ${i + 1}/${splitResult.totalChunks}`);
        
        const embeddingResult = await embeddingService.createVectors(chunk.content);
        
        const chunkData = {
          id: `chunk_${i}`,
          content: chunk.content,
          embedding: embeddingResult.embeddings,
          metadata: chunk.metadata
        };
        
        chunksWithEmbeddings.push(chunkData);
        
        // Prepare vector for storage
        vectorsToStore.push({
          id: `chunk_${Date.now()}_${i}`,
          values: embeddingResult.embeddings,
          metadata: {
            content: chunk.content,
            chunkIndex: chunk.metadata.chunkIndex,
            totalChunks: chunk.metadata.totalChunks,
            originalTextLength: splitResult.originalLength
          }
        });
      }
      
      responseData = {
        chunks: chunksWithEmbeddings,
        vectorsStored: vectorsToStore.length
      };
    } else {
      console.log('Processing text without chunking');
      
      // Process entire text as single chunk
      const result = await embeddingService.createVectors(text);
      console.log('Vector creation successful, embedding length:', result.embeddings.length);
      
      vectorsToStore.push({
        id: `single_${Date.now()}`,
        values: result.embeddings,
        metadata: {
          content: text,
          originalTextLength: text.length
        }
      });
      
      responseData = {
        embedding: result.embeddings,
        vectorsStored: 1
      };
    }

    // Save vectors to Vectorize
    console.log(`Attempting to save ${vectorsToStore.length} vectors to Vectorize`);
    const savedResult = await embeddingService.storeVectors({ vectors: vectorsToStore });
    console.log('Vectors saved to Vectorize:', savedResult);

    return c.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error vectorizing data:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return c.json({ success: false, error: 'Failed to vectorize data' }, 500);
  }
};