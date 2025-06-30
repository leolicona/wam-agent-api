import { CharacterTextSplitter, RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
  keepSeparator?: boolean;
}

export interface TextChunk {
  content: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    startIndex: number;
    endIndex: number;
    text: string;
  };
}

export interface TextSplitterResult {
  chunks: TextChunk[];
  totalChunks: number;
  originalLength: number;
}

/**
 * Length-based text splitter service using LangChain
 * Provides multiple splitting strategies for different use cases
 */
export const textSplitter = () => {
  /**
   * Character-based splitting - splits text by character count
   * Good for simple length-based chunking
   */
  const characterSplit = async (
    text: string,
    options: TextSplitterOptions = {}
  ): Promise<TextSplitterResult> => {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      separators = ['\n\n', '\n', ' ', ''],
      keepSeparator = false
    } = options;

    const splitter = new CharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separator: separators[0],
      keepSeparator
    });

    const documents = await splitter.splitText(text);
    
    return createTextSplitterResult(text, documents);
  };

  /**
   * Recursive character splitting - tries to keep related text together
   * Attempts to split on paragraphs first, then sentences, then words
   * This is the recommended approach for most use cases
   */
  const recursiveSplit = async (
    text: string,
    options: TextSplitterOptions = {}
  ): Promise<TextSplitterResult> => {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      separators = ['\n\n', '\n', ' ', '']
    } = options;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators
    });

    const documents = await splitter.splitText(text);
    
    return createTextSplitterResult(text, documents);
  };

  /**
   * Token-based splitting - splits based on token count
   * Useful when working with language models that have token limits
   */
  const tokenSplit = async (
    text: string,
    options: TextSplitterOptions = {}
  ): Promise<TextSplitterResult> => {
    const {
      chunkSize = 500, // tokens
      chunkOverlap = 50
    } = options;

    // For token-based splitting, we'll use a simple approximation
    // 1 token ≈ 4 characters for English text
    const approximateCharSize = chunkSize * 4;
    const approximateCharOverlap = chunkOverlap * 4;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: approximateCharSize,
      chunkOverlap: approximateCharOverlap,
      separators: ['\n\n', '\n', ' ', '']
    });

    const documents = await splitter.splitText(text);
    
    return createTextSplitterResult(text, documents);
  };

  /**
   * Simple length-based splitting without overlap
   * Splits text into fixed-size chunks
   */
  const simpleSplit = (text: string, chunkSize: number = 1000): TextSplitterResult => {
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    
    return createTextSplitterResult(text, chunks);
  };

  return {
    characterSplit,
    recursiveSplit,
    tokenSplit,
    simpleSplit
  };
};

/**
 * Helper function to create standardized result format
 */
function createTextSplitterResult(originalText: string, chunks: string[]): TextSplitterResult {
  let currentIndex = 0;
  
  const textChunks: TextChunk[] = chunks.map((chunk, index) => {
    const startIndex = currentIndex;
    const endIndex = startIndex + chunk.length;
    currentIndex = endIndex;
    
    return {
      content: chunk,
      metadata: {
        chunkIndex: index,
        totalChunks: chunks.length,
        startIndex,
        endIndex,
        text: chunk
      }
    };
  });

  return {
    chunks: textChunks,
    totalChunks: chunks.length,
    originalLength: originalText.length
  };
}

/**
 * Default export for easy importing
 */
export default textSplitter;