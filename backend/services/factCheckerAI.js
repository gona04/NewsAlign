// backend/services/factChecker.js
import OpenAI from 'openai';
import { searchIndex } from './vectorStore.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function factCheck(statement) {
  const relevantArticles = await searchIndex(statement, 5);

  const context = relevantArticles
    .map((a, i) => `${i + 1}. ${a.headline} (source: ${a.source})`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a fact-checker. Given news headlines and a statement, 
        determine if the statement is TRUE, FALSE, or UNCERTAIN. 
        Always cite which headlines support your verdict.`,
        temrature:0
      },
      {
        role: 'user',
        content: `Statement: "${statement}"\n\nRelevant news:\n${context}`
      }
    ]
  });

  return {
    verdict: response.choices[0].message.content,
    sources: relevantArticles
  };
}