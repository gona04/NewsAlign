import natural from "natural";
import callingScaper from "../scraping/callingNewsPortals.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const userInput = "Trump says he resorted the India Pakistan war";
const stopwords = [
  "a",
  "an",
  "the",
  "is",
  "to",
  "about",
  "and",
  "or",
  "in",
  "on",
  "for",
  "of",
  "with",
  "at",
  "by",
  "from",
  "up",
  "down",
  "out",
  "over",
  "under",
];
const stemmer = natural.PorterStemmer;
let headlines = [];

export function cleaningingInput(input) {
  // Convert input to lowercase and remove punctuation
  let cleanInput = input
    .toLowerCase() // Convert to lowercase
    .replace(/[?.,!]/g, "") // Remove punctuation
    .split(/\s+/); // Split into words

  // Remove stopwords and apply stemming
  cleanInput = cleanInput
    .filter((word) => !stopwords.includes(word)) // Remove stopwords
    .map((word) => stemmer.stem(word)); // Apply stemming

  // Remove duplicate words
  let uniqueWords = [...new Set(cleanInput)];

  // Join the cleaned words back into a single string
  return uniqueWords.join(" ");
}

// Helper to remove timestamp and section prefix
function removeTimestamp(title) {
  // FOR PUPETEER Matches patterns like "48 min ago - world " or "1 hour ago - industry "
  // return title.replace(/^\s*\d+\s+\w+\s+ago\s*-\s*\w+\s*/i, "").trim();
  // Remove ISO 8601 timestamps with optional spaces around dashes, e.g. "2025 - 06 - 08T20:44:25+05:30 -"
   return title
    .replace(
      /\d{4}\s*-\s*\d{2}\s*-\s*\d{2}T\d{2}:\d{2}:\d{2}(?:\+\d{2}:\d{2}|Z)?\s*-\s*/g,
      ""
    )
    .replace(/^\s*\d+\s+\w+\s+ago\s*-\s*\w+\s*/i, "")
    .trim();
}

// Scrape and save both neutralized and unNeutralized headlines
export async function scrapeAndSaveHeadlines() {
  const data = await callingScaper();
  const hindu = data[0].data;
  const factChecking = data[1].data;

  const neutralized = [];
  const unNeutralized = [];

  hindu.forEach((h) => {
    const cleanedTitle = removeTimestamp(h.title);
    neutralized.push(cleaningingInput(cleanedTitle));
    unNeutralized.push(cleanedTitle);
  });
  factChecking.forEach((f) => {
    neutralized.push(cleaningingInput(f.title));
    unNeutralized.push(f.title);
  });

  const scrapedDataDir = path.join(__dirname, "../scraped_data");
  if (!fs.existsSync(scrapedDataDir)) {
    fs.mkdirSync(scrapedDataDir, { recursive: true });
  }
  // Save both arrays
  fs.writeFileSync(
    path.join(scrapedDataDir, "headlines.json"),
    JSON.stringify(neutralized, null, 2)
  );
  fs.writeFileSync(
    path.join(scrapedDataDir, "unNeutralizedHeadlines.json"),
    JSON.stringify(unNeutralized, null, 2)
  );
}

// Load neutralized headlines
export function loadHeadlines() {
  const rawData = fs.readFileSync(
    path.join(__dirname, "../scraped_data/headlines.json"),
    "utf-8"
  );
  return JSON.parse(rawData);
}

// Load unNeutralized headlines
export function loadUnNeutralizedHeadlines() {
  const rawData = fs.readFileSync(
    path.join(__dirname, "../scraped_data/unNeutralizedHeadlines.json"),
    "utf-8"
  );
  return JSON.parse(rawData);
}
