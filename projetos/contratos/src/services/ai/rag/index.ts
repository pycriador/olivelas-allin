/**
 * Camada de preparação para RAG (Sprint futura).
 * Interfrução apenas — sem dependências de vector store instaladas.
 */

export interface RAGChunk {
  id: string;
  sourceId: string;
  seq: number;
  content: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export interface RAGEmbedding {
  vector: number[];
  sourceId: string;
  chunkId: string;
}

export interface RAGQuery {
  text: string;
  topK: number;
  filters?: Record<string, unknown>;
}

export interface RAGResult {
  chunk: RAGChunk;
  score: number;
}

export interface Chunker {
  chunk(text: string, maxTokens?: number): RAGChunk[];
}

export interface EmbeddingsProvider {
  embed(input: string | string[]): Promise<number[][]>;
}

export interface DocumentStore {
  addChunks(chunks: RAGChunk[]): Promise<void>;
  removeSource(sourceId: string): Promise<void>;
}

export interface VectorSearch {
  search(query: RAGEmbedding | { vector: number[] }, topK: number): Promise<RAGResult[]>;
}

export interface Retriever {
  retrieve(query: RAGQuery): Promise<RAGResult[]>;
}

export interface Ranker {
  rerank(results: RAGResult[], query: string): Promise<RAGResult[]>;
}

/** Implementações marcam a funcionalidade como não implementada nesta sprint. */
export function notImplemented(name: string): never {
  throw new Error(`${name} ainda não implementado — Sprint RAG futura.`);
}

export class ChunkerStub implements Chunker {
  chunk(text: string, maxTokens = 800): RAGChunk[] {
    notImplemented("ChunkerStub");
    return [];
  }
}

export class DocumentStoreStub implements DocumentStore {
  async addChunks(_chunks: RAGChunk[]): Promise<void> {
    notImplemented("DocumentStoreStub");
  }
  async removeSource(_sourceId: string): Promise<void> {
    notImplemented("DocumentStoreStub");
  }
}

export class VectorSearchStub implements VectorSearch {
  async search(): Promise<RAGResult[]> {
    notImplemented("VectorSearchStub");
    return [];
  }
}

export class RetrieverStub implements Retriever {
  async retrieve(): Promise<RAGResult[]> {
    notImplemented("RetrieverStub");
    return [];
  }
}

export class RankerStub implements Ranker {
  async rerank(results: RAGResult[], _query: string): Promise<RAGResult[]> {
    return results;
  }
}
