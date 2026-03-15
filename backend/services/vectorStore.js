import { pipeline } from '@xenova/transformers';
import faiss from 'faiss-node';

let index = null;
let storedArticles = [];
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading embedder model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedder model loaded');
  }
  return embedder;
}

export async function buildIndex(articles) {
  const validArticles = articles
    .filter(a => a !== null && a !== undefined && a !== '')
    .map(a => typeof a === 'string' ? { headline: a } : a)
    .filter(a => a.headline && a.headline.trim() !== '');

  if (validArticles.length === 0) {
    console.warn('No valid articles to index');
    return;
  }

  const embed = await getEmbedder();
  const embeddings = [];
  storedArticles = [];

  for (const article of validArticles) {
    const output = await embed(article.headline, { pooling: 'mean', normalize: true });
    embeddings.push(Array.from(output.data));
    storedArticles.push(article);
  }

  index = new faiss.IndexFlatL2(embeddings[0].length);
  index.add(embeddings.flat());
  console.log(`Index built with ${validArticles.length} articles`);
}

export async function searchIndex(query, topK = 3) {
  if (!query || query.trim() === '') {
    throw new Error('Query cannot be empty');
  }

  if (!index) {
    throw new Error('Index not built yet');
  }

  const embed = await getEmbedder();
  const output = await embed(query, { pooling: 'mean', normalize: true });
  const queryVec = Array.from(output.data);

  const actualTopK = Math.min(topK, storedArticles.length);
  const result = index.search(queryVec, actualTopK);

  return result.labels
    .filter(i => i !== -1 && i < storedArticles.length)
    .map(i => storedArticles[i]);
}