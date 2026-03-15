import {
  loadUnNeutralizedHeadlines,
  scrapeAndSaveHeadlines
} from '../../tensor-flow-model/userInput/handelingUserInput.js';
import { classifyUserStatementService } from '../services/classifyService.js';
import { buildIndex } from '../services/vectorStore.js';
import { logActivity, getOrCreateUser } from '../services/usageService.js';

let cachedNews = null;
let indexBuilt = false;

setTimeout(async () => {
  try {
    console.log('Starting scraper...');
    await scrapeAndSaveHeadlines();
    cachedNews = loadUnNeutralizedHeadlines();
    await buildIndex(cachedNews);
    indexBuilt = true;
    console.log('Scraping and indexing complete');
  } catch (err) {
    console.error('Startup scraping/indexing failed:', err.message);
  }
}, 0);

export const classify = async (req, res) => {
  const auth0Id = req.auth?.payload?.sub;
  const email =
    req.auth?.payload?.['https://fact-checker/email'] ||
    req.auth?.payload?.email ||
    null;
  const name =
    req.auth?.payload?.['https://fact-checker/name'] ||
    req.auth?.payload?.name ||
    null;
  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: 'userInput is required' });
  }

  try {
    // Ensure user exists before logging activity
    if (auth0Id) await getOrCreateUser(auth0Id, email, name);

    const result = await classifyUserStatementService(userInput);

    if (auth0Id) {
      await logActivity(auth0Id, userInput, 'nlp', JSON.stringify(result));
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const vectorClassify = async (req, res) => {
  const auth0Id = req.auth?.payload?.sub;
  const email =
    req.auth?.payload?.['https://fact-checker/email'] ||
    req.auth?.payload?.email ||
    null;
  const name =
    req.auth?.payload?.['https://fact-checker/name'] ||
    req.auth?.payload?.name ||
    null;
  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: 'userInput is required' });
  }

  if (!indexBuilt) {
    return res.status(503).json({
      error: 'Index is still being built. Please try again in a moment.',
    });
  }

  try {
    // Ensure user exists before logging activity
    if (auth0Id) await getOrCreateUser(auth0Id, email, name);

    const result = await classifyUserStatementService(userInput, 'vector');

    if (auth0Id) {
      await logActivity(auth0Id, userInput, 'nlp_vector_store', JSON.stringify(result));
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const news = async (req, res) => {
  if (!cachedNews) {
    cachedNews = loadUnNeutralizedHeadlines();
  }
  return res.status(200).json({ data: cachedNews });
};