import { classifyUserStatement } from '../../tensor-flow-model/model/model-comparision.js';
import { loadUnNeutralizedHeadlines, cleaningingInput } from '../../tensor-flow-model/userInput/handelingUserInput.js';
import { fuzzyFilterHeadlines } from '../../tensor-flow-model/userInput/matching-similar-sentences.js';
import { searchIndex } from './vectorStore.js';

export const classifyUserStatementService = async (userInput, type = 'default') => {
  const allHeadlines = loadUnNeutralizedHeadlines();
  console.log('Total headlines loaded:', allHeadlines.length);
  console.log('Sample headlines:', allHeadlines.slice(0, 3));

  let topHeadlines;

  if (type.match('vector')) {
    // searchIndex returns objects like { headline: '...' } or plain strings
    const relevantHeadLines = await searchIndex(userInput);
    topHeadlines = relevantHeadLines.map(a => a.headline || a); // ← already strings, no .item needed
    console.log('Vector matches:', topHeadlines);
  } else {
    // fuzzyFilterHeadlines returns Fuse.js objects with .item property
    const fuzzyMatches = fuzzMatch(userInput, allHeadlines);
    topHeadlines = fuzzyMatches.map(match => match.item); // ← .item needed here
  }

  if (topHeadlines.length === 0) {
    return {
      matches: [],
      result: "Can't say — no relevant news found for this statement."
    };
  }

  const cleanedHeadlines = topHeadlines.map(headline => cleaningingInput(headline));

  let output = [];
  const storeLog = inputs => output.push(inputs);
  const originalLog = console.log;
  console.log = storeLog;
  await classifyUserStatement(userInput, cleanedHeadlines, topHeadlines);
  console.log = originalLog;

  return {
    matches: topHeadlines,
    result: output.join('\n') || "Can't say — statements were too dissimilar to headlines."
  };
};

function fuzzMatch(userInput, allHeadlines) {
  const fuzzyMatches = fuzzyFilterHeadlines(userInput, allHeadlines, 3);
  console.log('Fuzzy matches:', fuzzyMatches);
  return fuzzyMatches;
}