import express from 'express';
import { classify, news, vectorClassify } from '../controller/classifyController.js';
import { getUsageStats } from '../controller/usageController.js';

const router = express.Router();

router.post('/classify', classify);
router.post('/vector-classify', vectorClassify)
router.get('/news', news);
router.get('/usage', getUsageStats);

export default router;