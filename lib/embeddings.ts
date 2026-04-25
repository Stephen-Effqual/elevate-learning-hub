// Simple text chunking and similarity search for RAG
// We'll use basic TF-IDF style search for simplicity

interface DocumentChunk {
  content: string;
  fileId: string;
  filename: string;
  score?: number;
}

export function chunkText(text: string, chunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export function calculateSimilarity(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  
  let score = 0;
  for (const term of queryTerms) {
    const regex = new RegExp(term, "gi");
    const matches = textLower.match(regex);
    score += matches ? matches.length : 0;
  }

  return score / Math.sqrt(text.length);
}

export function searchDocuments(
  query: string,
  documents: { content: string; fileId: string; filename: string }[],
  topK: number = 5
): DocumentChunk[] {
  const scoredDocs = documents.map(doc => ({
    ...doc,
    score: calculateSimilarity(query, doc.content)
  }));

  return scoredDocs
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topK)
    .filter(doc => (doc.score ?? 0) > 0);
}
