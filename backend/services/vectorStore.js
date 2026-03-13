// backend/services/vectorStore.js
import { pipeline } from '@xenova/transformers';
import faiss from 'faiss-node';

let index = null;
let storedArticles = [];

export async function buildIndex(articles) {
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const embeddings = [];

  for (const article of articles) {
    const output = await embedder(article.headline, { pooling: 'mean', normalize: true });
    embeddings.push(Array.from(output.data));
    storedArticles.push(article);
  }

  index = new faiss.IndexFlatL2(embeddings[0].length);
  index.add(embeddings.flat());
}

export async function searchIndex(query, topK = 5) {
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await embedder(query, { pooling: 'mean', normalize: true });
  const queryVec = Array.from(output.data);

  const result = index.search(queryVec, topK);
  return result.labels.map(i => storedArticles[i]);
}