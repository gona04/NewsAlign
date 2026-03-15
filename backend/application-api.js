import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { protectedRouter, publicRouter } from './routers/classifyRouter.js';
import factCheckingRouter from './routers/factCheckingRouter.js';
import { checkJwt } from './middleware/auth.js';
import './db/client.js';

const app = express();

// CORS — restrict to your frontend URLs
app.use(cors({
  origin: ['http://localhost:3030', 'https://your-app.netlify.app'],
}));

app.use(express.json());

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// Public routes — no auth required
app.use('/api', publicRouter);

// Protected routes — require valid Auth0 JWT token
app.use('/api', checkJwt, protectedRouter);
app.use('/fact-checking', checkJwt, factCheckingRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});