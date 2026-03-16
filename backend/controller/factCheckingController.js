import { factCheck } from '../services/factCheckerAI.js';
import { checkAndIncrementUsage, logActivity } from '../services/usageService.js';
import { MAX_DAILY_CALLS } from '../utils/constants.js';

export const checkingFacts = async (req, res) => {
  const t0 = Date.now();

  const auth0Id = req.auth.payload.sub;
  const email =
    req.auth.payload['https://fact-checker/email'] ||
    req.auth.payload.email ||
    null;
  const name =
    req.auth.payload['https://fact-checker/name'] ||
    req.auth.payload.name ||
    null;

  try {
    const usage = await checkAndIncrementUsage(auth0Id, email, name);
    console.log(`Usage check took: ${Date.now() - t0}ms`);

    if (!usage.allowed) {
      return res.status(429).json({
        error: `You have used all ${MAX_DAILY_CALLS} of your daily AI fact-checks.`,
        resetsAt: usage.resetsAt,
      });
    }

    const { statement, userInput } = req.body;
    const query = statement || userInput;

    const result = await factCheck(query);
    console.log(`OpenAI call took: ${Date.now() - t0}ms`);

    await logActivity(
      auth0Id,
      query,
      'llm_vector_store',
      JSON.stringify(result)
    );
    console.log(`Activity log took: ${Date.now() - t0}ms`);
    console.log(`Total request time: ${Date.now() - t0}ms`);

    return res.json({ ...result, remaining: usage.remaining });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};