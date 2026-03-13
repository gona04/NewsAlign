import { factCheck } from '../services/factCheckerAI.js';

export const checkingFacts = async (req, res) => {
  const { statement } = req.body;
  const result = await factCheck(statement);
  res.json(result);
};