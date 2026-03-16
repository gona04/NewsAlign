import { getUsage, getOrCreateUser } from '../services/usageService.js';

export const getUsageStats = async (req, res) => {
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
    await getOrCreateUser(auth0Id, email, name);
    const usage = await getUsage(auth0Id);
    return res.json(usage);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};