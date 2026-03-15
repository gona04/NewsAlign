import express from 'express';
import { checkingFacts } from '../controller/factCheckingController.js';

const router = express.Router();

router.post('/fact-check', checkingFacts);

export default router;