import { describe, it, expect } from 'vitest';
import { textSplitter } from './text-splitter.service';

describe('Text Splitter Service', () => {
  const sampleText = `
This is a sample document with multiple paragraphs.
It contains various types of content that we want to split into chunks.

The first paragraph talks about the importance of text chunking in natural language processing.
When working with large documents, it's essential to break them down into manageable pieces.

The second paragraph discusses different strategies for text splitting.
Length-based splitting is one of the most common approaches.
It ensures that each chunk doesn't exceed a specified size limit.

The third paragraph covers the benefits of using LangChain for text splitting.
LangChain provides robust and well-tested implementations.
It supports various splitting strategies and customization options.
  `;

  const splitter = textSplitter();

  it('should split text using character-based strategy', async () => {
    const result = await splitter.characterSplit(sampleText, {
      chunkSize: 200,
      chunkOverlap: 50
    });

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.totalChunks).toBe(result.chunks.length);
    expect(result.originalLength).toBe(sampleText.length);
    
    // Check that each chunk has proper metadata
    result.chunks.forEach((chunk, index) => {
      expect(chunk.metadata.chunkIndex).toBe(index);
      expect(chunk.metadata.totalChunks).toBe(result.totalChunks);
      expect(chunk.metadata.text).toBe(chunk.content);
      expect(chunk.content.length).toBeLessThanOrEqual(250); // Some flexibility for overlap
    });
  });

  it('should split text using recursive strategy', async () => {
    const result = await splitter.recursiveSplit(sampleText, {
      chunkSize: 300,
      chunkOverlap: 100
    });

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.totalChunks).toBe(result.chunks.length);
    
    // Recursive splitting should try to keep paragraphs together
    const hasCompleteLines = result.chunks.some(chunk => 
      chunk.content.includes('\n\n')
    );
    expect(hasCompleteLines).toBe(true);
  });

  it('should split text using token-based strategy', async () => {
    const result = await splitter.tokenSplit(sampleText, {
      chunkSize: 50, // tokens
      chunkOverlap: 10
    });

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.totalChunks).toBe(result.chunks.length);
    
    // Token-based chunks should be roughly 200 characters (50 tokens * 4 chars/token)
    result.chunks.forEach(chunk => {
      expect(chunk.content.length).toBeLessThanOrEqual(300); // Some flexibility
    });
  });

  it('should split text using simple strategy', () => {
    const result = splitter.simpleSplit(sampleText, 250);

    expect(result.chunks.length).toBeGreaterThan(1);
    expect(result.totalChunks).toBe(result.chunks.length);
    
    // Simple splitting should create fixed-size chunks (except possibly the last one)
    result.chunks.forEach((chunk, index) => {
      if (index < result.chunks.length - 1) {
        expect(chunk.content.length).toBe(250);
      } else {
        expect(chunk.content.length).toBeLessThanOrEqual(250);
      }
    });
  });

  it('should handle small text that doesn\'t need chunking', async () => {
    const smallText = 'This is a small text.';
    const result = await splitter.recursiveSplit(smallText, {
      chunkSize: 1000,
      chunkOverlap: 100
    });

    expect(result.chunks.length).toBe(1);
    expect(result.chunks[0].content).toBe(smallText);
    expect(result.chunks[0].metadata.chunkIndex).toBe(0);
    expect(result.chunks[0].metadata.totalChunks).toBe(1);
    expect(result.chunks[0].metadata.text).toBe(smallText);
  });

  it('should handle custom separators', async () => {
    const customText = 'Section 1|Section 2|Section 3|Section 4';
    const result = await splitter.characterSplit(customText, {
      chunkSize: 15,
      chunkOverlap: 0,
      separators: ['|'],
      keepSeparator: false
    });

    expect(result.chunks.length).toBeGreaterThan(1);
    // Should split on the custom separator
    result.chunks.forEach(chunk => {
      expect(chunk.content).not.toContain('|');
      expect(chunk.metadata.text).toBe(chunk.content);
    });
  });
});