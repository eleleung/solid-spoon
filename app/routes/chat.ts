import express from "express";
import path from "path";
import util from "util";
import fs from "fs";

import { checkForChatProvider } from "../service/detectChatProvider";
import puppeteer, { Browser } from "puppeteer";

const router = express.Router();
const readdir = util.promisify(fs.readdir);
const dataDirectory: string = path.join(__dirname, "../data");
const batchSize = 40;

router.get("/find", async (_, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 60000,
  });
  try {
    const files = await readdir(dataDirectory);
    const results = await processFilesInBatches(browser, files, batchSize);

    res.json(results);
  } catch (error) {
    res.status(500).send("Error processing your request");
  } finally {
    await browser.close();
  }
});

const processFilesInBatches = async (
  browser: Browser,
  files: string[],
  batchSize: number
) => {
  const results: Array<{
    companyName: string;
    chatService: "drift" | "salesforce" | null;
  }> = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const htmlFilePath = path.join(dataDirectory, file);
        const companyName = file.replace(".html", "");
        const chatServiceResult = await checkForChatProvider(
          browser,
          htmlFilePath
        );
        return { companyName, chatService: chatServiceResult };
      })
    );
    results.push(...batchResults);
  }

  return results;
};

// Use to get a count of results
const tallyResults = (
  results: Array<{
    companyName: string;
    chatService: "drift" | "salesforce" | null;
  }>
) => {
  const counts = results.reduce<Record<string, number>>(
    (acc, { chatService }) => {
      if (chatService !== null) {
        acc[chatService] = (acc[chatService] || 0) + 1;
      }
      return acc;
    },
    {}
  );
  console.log(counts);
};

export default router;
