import { factCheck } from '../services/factCheckerAI.js';
import { checkAndIncrementUsage } from '../services/usageService.js';

export const checkingFacts = async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload.email;
  const name = req.auth.payload.name;

  try {
    const usage = await checkAndIncrementUsage(auth0Id, email, name);

    if (!usage.allowed) {
      return res.status(429).json({
        error: 'You have used all 6 of your daily AI fact-checks.',
        resetsAt: usage.resetsAt,
      });
    }

    const { statement, userInput } = req.body;
    const query = statement || userInput;
    const result = await factCheck(query);
    return res.json({ ...result, remaining: usage.remaining });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};