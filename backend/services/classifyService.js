import { classifyUserStatement } from '../../tensor-flow-model/model/model-comparision.js';
import { loadUnNeutralizedHeadlines, cleaningingInput } from '../../tensor-flow-model/userInput/handelingUserInput.js';
import { fuzzyFilterHeadlines } from '../../tensor-flow-model/userInput/matching-similar-sentences.js';

export const classifyUserStatementService = async (userInput) => {
  // 1. Load all headlines
  const allHeadlines = loadUnNeutralizedHeadlines();

  // 2. Debug — remove once working
  console.log('Total headlines loaded:', allHeadlines.length);
  console.log('Sample headlines:', allHeadlines.slice(0, 3));

  // 3. Get top 3 fuzzy matches
  const fuzzyMatches = fuzzyFilterHeadlines(userInput, allHeadlines, 3);
  console.log('Fuzzy matches:', fuzzyMatches); // ← debug

  const topHeadlines = fuzzyMatches.map(match => match.item);

  // 4. No matches found
  if (topHeadlines.length === 0) {
    return {
      matches: [],
      result: "Can't say — no relevant news found for this statement."
    };
  }

  // 5. Clean the fuzzy-matched headlines for NLP
  const cleanedHeadlines = topHeadlines.map(headline => cleaningingInput(headline));

  // 6. Compare with Universal Sentence Encoder
  let output = [];
  const storeLog = inputs => output.push(inputs);
  const originalLog = console.log;
  console.log = storeLog;
  await classifyUserStatement(userInput, cleanedHeadlines, topHeadlines);
  console.log = originalLog;

  // 7. Return results
  return { 
    matches: topHeadlines,
    result: output.join('\n') || "Can't say — statements were too dissimilar to headlines."
  };
};