import express from 'express';
import { classify, news } from '../controller/classifyController.js';

const router = express.Router();

router.post('/classify', classify);
router.get('/news', news);



export default router;