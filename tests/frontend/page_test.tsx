// integration tests for frontend pages
const websiteUrl = process.env.WEBSITE_URL || 'https://www.selenium.dev/selenium/web/web-form.html';

import { Builder, By, WebDriver, until } from 'selenium-webdriver';
import assert from 'assert';
describe('First script', function () {
    let driver: WebDriver;
  
    before(async function () {
      driver = await new Builder().forBrowser('chrome').build();
    });
  
    it('Test with environment variable for URL', async function () {
        await driver.get(websiteUrl);
    
        const title = await driver.getTitle();
        console.log(`Page Title: ${title}`);
        
        // Add your test steps here...
        //1. Testing search
        /*const searchInput = await driver.findElement(By.id("search-input"));
        const searchButton = await driver.findElement(By.id("search-button"));

        await searchInput.sendKeys("Test Query");
        await searchButton.click();
        await driver.wait(until.elementLocated(By.id("search-results")), 5000);

        const results = await driver.findElements(By.css(".search-result"));
        assert.ok(results.length > 0, "No search results found");

        const firstResultText = await results[0].getText();
        assert.ok(firstResultText.includes("Test Query"), "Search query not in results");*/

        //2. Testing File upload

        /*it("should upload a file", async function () {
        // Navigate to your website
        await driver.get("https://yourwebsite.com/file-upload");

        const fileInput = await driver.findElement(By.id("file-upload"));
        const filePath = path.resolve(__dirname, "example-file.txt");
        await fileInput.sendKeys(filePath);

        const successMessage = await driver.findElement(By.id("upload-success"));
        const messageText = await successMessage.getText();
        assert.strictEqual(messageText, "File uploaded successfully!");*/

    });
  
    after(async function () {
      if (driver) {
        await driver.quit();
      }
    });
  });