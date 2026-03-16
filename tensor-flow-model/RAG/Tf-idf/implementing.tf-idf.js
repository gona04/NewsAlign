import { headlines } from "../../scraped_data/export-unprocessed-data.js";

//For the query
function normalize(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .trim();
}

// Pre processing data
function preprocessingData(document) {
  let documentWord = document.map((data) => {
    let split_data = data.split(" ");
    // Clean each word and filter out empty strings
    let cleaned = split_data
      .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
      .filter((word) => word.length > 0);
    return cleaned.join(" ").toLowerCase();
  });
  return documentWord;
}

//Calculate tf
function calculateTf(cleanTextDocument, query) {
  
let totalFrequencyOfQuery = 0;
let totalNumberOfWords= 0;

  const regex = new RegExp(`\\b${query}\\b`, "g");
  const matchingSentences = cleanTextDocument.filter((sentence) =>
    sentence.match(regex)
  );
  console.log(matchingSentences);
  matchingSentences.forEach((sentence) => {
    let a = sentence.split(" ");
    let timesQuery = a.filter((word) => word.match(regex))
    totalFrequencyOfQuery = totalFrequencyOfQuery + timesQuery.length
    totalNumberOfWords = totalNumberOfWords + a.length;
  });
  return totalFrequencyOfQuery / totalNumberOfWords;
}

function calculateIdF(cleanedDocument, cleanedQuery) {
    const regex = new RegExp(`\\b${cleanedQuery}\\b`, "g");
     const matchingSentences = cleanedDocument.filter((sentence) =>
    sentence.match(regex)
  );

  console.log(Math.log10(cleanedDocument.length/matchingSentences.length))
  return Math.log10(cleanedDocument.length/matchingSentences.length);

}

const cleanText = preprocessingData(headlines);
const cleanedQuery = normalize("Technology");
console.log(calculateTf(cleanText, cleanedQuery));
console.log(calculateIdF(cleanText, cleanedQuery))
const tf = calculateTf(cleanText, cleanedQuery);
const idf = calculateIdF(cleanText, cleanedQuery);
const result = tf*idf;
console.log(result)