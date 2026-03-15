import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadUnNeutralizedHeadlines,
  scrapeAndSaveHeadlines
} from '../../tensor-flow-model/userInput/handelingUserInput.js';
import { classifyUserStatementService } from '../services/classifyService.js';
import { buildIndex } from '../services/vectorStore.js';
import { logActivity, getOrCreateUser } from '../services/usageService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LAST_SCRAPE_FILE = path.join(__dirname, '../../tensor-flow-model/scraped_data/last_scrape.json');

let cachedNews = null;
let indexBuilt = false;

// Check if scrape data is from today
function isScrapedToday() {
  try {
    if (!fs.existsSync(LAST_SCRAPE_FILE)) return false;
    const { date } = JSON.parse(fs.readFileSync(LAST_SCRAPE_FILE, 'utf-8'));
    const lastScrape = new Date(date);
    const now = new Date();
    return (
      lastScrape.getDate() === now.getDate() &&
      lastScrape.getMonth() === now.getMonth() &&
      lastScrape.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
}

// Save the timestamp of the last scrape
function saveLastScrapeTime() {
  fs.writeFileSync(LAST_SCRAPE_FILE, JSON.stringify({ date: new Date().toISOString() }));
}

// Core scrape and index function — reused by both startup and cron
async function scrapeAndIndex() {
  console.log('Scraping headlines...');
  await scrapeAndSaveHeadlines();
  saveLastScrapeTime();
  cachedNews = loadUnNeutralizedHeadlines();
  await buildIndex(cachedNews);
  indexBuilt = true;
  console.log(`Scrape complete — ${cachedNews.length} headlines indexed`);
}

// On server startup — only scrape if not already done today
setTimeout(async () => {
  try {
    if (isScrapedToday()) {
      console.log('Headlines already scraped today — loading from file');
      cachedNews = loadUnNeutralizedHeadlines();
      await buildIndex(cachedNews);
      indexBuilt = true;
      console.log(`Loaded ${cachedNews.length} headlines from file`);
    } else {
      await scrapeAndIndex();
    }
  } catch (err) {
    console.error('Startup scraping/indexing failed:', err.message);
  }
}, 0);

// Schedule daily scrape at 8:00 AM IST (2:30 AM UTC)
cron.schedule('30 2 * * *', async () => {
  console.log('Running scheduled daily scrape...');
  try {
    await scrapeAndIndex();
  } catch (err) {
    console.error('Scheduled scrape failed:', err.message);
  }
}, {
  timezone: 'UTC'
});

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
    if (auth0Id) await getOrCreateUser(auth0Id, email, name);
    const result = await classifyUserStatementService(userInput);
    if (auth0Id) await logActivity(auth0Id, userInput, 'nlp', JSON.stringify(result));
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
    if (auth0Id) await getOrCreateUser(auth0Id, email, name);
    const result = await classifyUserStatementService(userInput, 'vector');
    if (auth0Id) await logActivity(auth0Id, userInput, 'nlp_vector_store', JSON.stringify(result));
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