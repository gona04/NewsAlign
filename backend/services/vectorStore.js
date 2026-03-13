// backend/services/vectorStore.js
import { pipeline } from '@xenova/transformers';
import faiss from 'faiss-node';

let index = null;
let storedArticles = [];

export async function buildIndex(articles) {
  // Handle both string arrays and object arrays
  const validArticles = articles
    .filter(a => a !== null && a !== undefined && a !== '')
    .map(a => typeof a === 'string' ? { headline: a } : a)
    .filter(a => a.headline && a.headline.trim() !== '');

  if (validArticles.length === 0) {
    console.warn('No valid articles to index');
    return;
  }

  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const embeddings = [];
  storedArticles = [];

  for (const article of validArticles) {
    const output = await embedder(article.headline, { pooling: 'mean', normalize: true });
    embeddings.push(Array.from(output.data));
    storedArticles.push(article);
  }

  index = new faiss.IndexFlatL2(embeddings[0].length);
  index.add(embeddings.flat());
  console.log(`Index built with ${validArticles.length} articles`);
}

export async function searchIndex(query, topK = 5) {
  if (!query || query.trim() === '') {
    throw new Error('Query cannot be empty');
  }

  if (!index) {
    throw new Error('Index not built yet');
  }

  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await embedder(query, { pooling: 'mean', normalize: true });
  const queryVec = Array.from(output.data);

  const actualTopK = Math.min(topK, storedArticles.length);
  const result = index.search(queryVec, actualTopK);

  return result.labels
    .filter(i => i !== -1 && i < storedArticles.length) // ← filter invalid labels
    .map(i => storedArticles[i]);
}