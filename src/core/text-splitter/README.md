# Text Splitter Service

A comprehensive text chunking service built with LangChain for the WAM Agent service. This service provides multiple strategies for splitting large texts into manageable chunks before vectorization.

## Features

- **Multiple Splitting Strategies**: Character-based, recursive, token-based, and simple splitting
- **Configurable Options**: Customizable chunk size, overlap, and separators
- **Metadata Tracking**: Each chunk includes detailed metadata about its position and context
- **LangChain Integration**: Built on top of LangChain's robust text splitting implementations

## Installation

The service uses LangChain text splitters:

```bash
npm install langchain @langchain/textsplitters
```

## Usage

### Basic Import

```typescript
import { textSplitter } from './text-splitter.service';
// or
import textSplitter from './text-splitter.service';
```

### Splitting Strategies

#### 1. Recursive Character Splitting (Recommended)

Tries to keep related text together by splitting on paragraphs first, then sentences, then words.

```typescript
const splitter = textSplitter();
const result = await splitter.recursiveSplit(text, {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', '']
});
```

#### 2. Character-Based Splitting

Splits text by character count with a specific separator.

```typescript
const result = await splitter.characterSplit(text, {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n'],
  keepSeparator: false
});
```

#### 3. Token-Based Splitting

Splits based on estimated token count (useful for language models).

```typescript
const result = await splitter.tokenSplit(text, {
  chunkSize: 500, // tokens
  chunkOverlap: 50
});
```

#### 4. Simple Splitting

Fixed-size chunks without overlap or separator consideration.

```typescript
const result = splitter.simpleSplit(text, 1000);
```

## API Reference

### TextSplitterOptions

```typescript
interface TextSplitterOptions {
  chunkSize?: number;        // Default: 1000
  chunkOverlap?: number;     // Default: 200
  separators?: string[];     // Default: ['\n\n', '\n', ' ', '']
  keepSeparator?: boolean;   // Default: false
}
```

### TextChunk

```typescript
interface TextChunk {
  content: string;
  metadata: {
    chunkIndex: number;      // 0-based index of this chunk
    totalChunks: number;     // Total number of chunks
    startIndex: number;      // Character start position in original text
    endIndex: number;        // Character end position in original text
    text: string;            // Original chunked text content
  };
}
```

### TextSplitterResult

```typescript
interface TextSplitterResult {
  chunks: TextChunk[];       // Array of text chunks
  totalChunks: number;       // Total number of chunks
  originalLength: number;    // Length of original text
}
```

## Integration with Vectorization API

The text splitter is integrated with the vectorization endpoint. You can enable chunking by including chunking options in your request:

```bash
curl -X POST http://localhost:8787/vectorize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your long text here...",
    "chunking": {
      "enabled": true,
      "strategy": "recursive",
      "chunkSize": 1000,
      "chunkOverlap": 200
    }
  }'
```

### Chunking Strategies Available via API

- `recursive` (default): Best for most use cases
- `character`: Simple character-based splitting
- `token`: Token-aware splitting for LLM compatibility
- `simple`: Fixed-size chunks without overlap

### API Response with Chunking

When chunking is enabled, the API returns detailed information about each chunk:

```json
{
  "success": true,
  "data": {
    "chunks": [
      {
        "id": "chunk_0",
        "content": "First chunk content...",
        "embedding": [0.1, 0.2, ...],
        "metadata": {
          "chunkIndex": 0,
          "totalChunks": 3,
          "startIndex": 0,
          "endIndex": 1000,
          "text": "First chunk content..."
        }
      }
    ],
    "vectorsStored": 3
  }
}
```

## Best Practices

1. **Choose the Right Strategy**:
   - Use `recursive` for general text processing
   - Use `token` when working with language models
   - Use `character` for simple, predictable splitting
   - Use `simple` for fixed-size requirements

2. **Optimize Chunk Size**:
   - Consider your embedding model's context window
   - Balance between context preservation and processing efficiency
   - Typical range: 500-2000 characters

3. **Set Appropriate Overlap**:
   - 10-20% of chunk size is usually optimal
   - Helps maintain context across chunk boundaries
   - Too much overlap increases processing cost

4. **Custom Separators**:
   - Use document-specific separators for better splitting
   - For code: `['\n\n', '\nclass ', '\ndef ', '\n', ' ']`
   - For articles: `['\n\n', '\n', '. ', ' ']`

## Testing

Run the test suite:

```bash
npm test src/core/text-splitter/text-splitter.test.ts
```

The tests cover all splitting strategies and edge cases.