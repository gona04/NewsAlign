import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { protectedRouter, publicRouter } from './routers/classifyRouter.js';
import factCheckingRouter from './routers/factCheckingRouter.js';
import { checkJwt } from './middleware/auth.js';
import './db/client.js';

const app = express();
app.use(cors());
app.use(express.json());

// Public routes — no auth required
app.use('/api', publicRouter);

// Protected routes — require valid Auth0 JWT token
app.use('/api', checkJwt, protectedRouter);
app.use('/fact-checking', checkJwt, factCheckingRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});