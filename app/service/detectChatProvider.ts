import * as puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const driftQueryString = "https://js.driftt.com";
const salesforceQueryString = "salesforceliveagent";

const detectDrift = async (page: puppeteer.Page): Promise<boolean> => {
  const pageContent = await page.content();
  const hasGlobalVariable = await page.evaluate(
    // @ts-expect-error
    () => window.drift !== undefined
  );
  return hasGlobalVariable || pageContent.includes(driftQueryString);
};

const detectSalesforce = async (page: puppeteer.Page): Promise<boolean> => {
  const pageContent = await page.content();
  const hasGlobalVariable = await page.evaluate(
    // @ts-expect-error
    () => window.aura !== undefined
  );
  return hasGlobalVariable || pageContent.includes(salesforceQueryString);
};

const staticAnalysis = (htmlContent: string): "drift" | "salesforce" | null => {
  if (htmlContent.includes(driftQueryString)) {
    return "drift";
  } else if (htmlContent.includes(salesforceQueryString)) {
    return "salesforce";
  }
  return null;
};

const dynamicAnalysis = async (
  browser: puppeteer.Browser,
  filePath: string
) => {
  const page = await browser.newPage();
  try {
    const fileURL = "file://" + path.resolve(filePath);

    await page.setRequestInterception(true);

    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const hasResourceType = ["image", "stylesheet", "font"].includes(
        resourceType
      );
      const hasRedirect =
        request.isNavigationRequest() && request.redirectChain().length !== 0;

      if (hasResourceType || hasRedirect) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(fileURL, {
      waitUntil: ["domcontentloaded", "networkidle2"],
    });

    page.mouse.click(1, 1, { button: "left" }); // to simulate user interaction

    if (await detectDrift(page)) {
      return "drift";
    }

    if (await detectSalesforce(page)) {
      return "salesforce";
    }
  } catch (error) {
    // TODO error handling
  } finally {
    await page.close();
  }
  return null;
};

export const checkForChatProvider = async (
  browser: puppeteer.Browser,
  htmlFilePath: string
) => {
  const htmlContent = fs.readFileSync(htmlFilePath, "utf8");
  const staticResult = staticAnalysis(htmlContent);

  if (staticResult) {
    return staticResult;
  } else {
    const dynamicResult = await dynamicAnalysis(browser, htmlFilePath);

    return dynamicResult;
  }
};
