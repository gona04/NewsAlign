// backend/services/factChecker.js
import OpenAI from 'openai';
import { searchIndex } from './vectorStore.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function factCheck(statement) {
  const relevantArticles = await searchIndex(statement, 5);

  if (relevantArticles.length === 0) {
    return {
      verdict: "Can't say — no relevant news found for this statement.",
      sources: []
    };
  }

  const context = relevantArticles
    .map((a, i) => `${i + 1}. ${a.headline || a}`) // ← handle missing source
    .join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0, // ← moved here, correct place
    messages: [
      {
        role: 'system',
        content: `You are a fact-checker. Given news headlines and a statement, 
        determine if the statement is TRUE, FALSE, or UNCERTAIN. 
        Always cite which headlines support your verdict.`
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