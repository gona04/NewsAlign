import { factCheck } from '../services/factCheckerAI.js';

export const checkingFacts = async (req, res) => {
  const { statement, userInput } = req.body;
  const query = statement || userInput; // handle both

  if (!query) {
    return res.status(400).json({ error: 'statement is required' });
  }

  try {
    const result = await factCheck(query);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};