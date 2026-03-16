import callingScaper from "./scraping/callingNewsPortals";

const main = async () => {
  console.log("Starting all scrapers...");

  try {
    await callingScaper(); 
  } catch (error) {
    console.error("Error occurred while running scrapers:", error);
  }

  console.log("All scrapers completed.");
};

main();