import express from 'express';
import { classify, vectorClassify, news } from '../controller/classifyController.js';
import { getUsageStats } from '../controller/usageController.js';

const protectedRouter = express.Router();
const publicRouter = express.Router();

// Public routes — no auth required
publicRouter.get('/news', news);

// Protected routes — require valid Auth0 JWT token
protectedRouter.post('/classify', classify);
protectedRouter.post('/vector-classify', vectorClassify);
protectedRouter.get('/usage', getUsageStats);

export { protectedRouter, publicRouter };