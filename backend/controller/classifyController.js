import { loadUnNeutralizedHeadlines, scrapeAndSaveHeadlines } from '../../tensor-flow-model/userInput/handelingUserInput.js';
import { classifyUserStatementService } from '../services/classifyService.js';
import { buildIndex } from '../services/vectorStore.js';

scrapeAndSaveHeadlines()
export const classify = async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ error: 'userInput is required' });
  }
  try {
    const result = await classifyUserStatementService(userInput);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const news = async (req, res) => {
    return res.status(200).json({data: getNews()})
}

function getNews() {
    let news = loadUnNeutralizedHeadlines();
    buildIndex(news);
    return news;
}