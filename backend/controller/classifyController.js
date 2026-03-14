import { loadUnNeutralizedHeadlines, scrapeAndSaveHeadlines } from '../../tensor-flow-model/userInput/handelingUserInput.js';
import { classifyUserStatementService } from '../services/classifyService.js';
import { buildIndex } from '../services/vectorStore.js';

// Build index once on server startup
scrapeAndSaveHeadlines().then(() => {
  const news = loadUnNeutralizedHeadlines();
  buildIndex(news);
  console.log('Vector index built');
});

export const classify = async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: 'userInput is required' });
  }
  try {
    const result = await classifyUserStatementService(userInput);
    return res.json(result); // ← only called once
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const vectorClassify = async (req, res) => {
  const {userInput} = req.body;
   if (!userInput) {
    return res.status(400).json({ error: 'userInput is required' });
  }
  try {
    const result = await classifyUserStatementService(userInput, 'vector');
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export const news = async (req, res) => {
  return res.status(200).json({ data: loadUnNeutralizedHeadlines() });
};