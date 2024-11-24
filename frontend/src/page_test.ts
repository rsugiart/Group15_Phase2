// // integration tests for frontend pages
const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

import { WebDriver } from 'selenium-webdriver';
const path = require('path');

const websiteUrl = process.env.WEBSITE_URL || 'https://example.com';

async function runTests() {
  let driver: WebDriver | null = null; // Initialize with null

  try {
    driver = await new Builder().forBrowser('chrome').build();

    console.log('Starting Tests...\n');

    // Test 1: Verify Page Title
    console.log('Running Test 1: Verify Page Title...');
    if (driver) {
      await driver.get(websiteUrl); // Check driver is not null
      const title = await driver.getTitle();
      console.log(`Page Title: ${title}`);
      assert.ok(title, 'Page title is empty');
    }

    // Test 2: Perform Search
    console.log('Running Test 2: Perform Search...');
    if (driver) {
      const searchInput = await driver.findElement(By.id('search-input')); // Replace with your actual ID
      const searchButton = await driver.findElement(By.id('search-button')); // Replace with your actual ID

      await searchInput.sendKeys('Test Query');
      await searchButton.click();

      await driver.wait(until.elementLocated(By.id('search-results')), 5000);
      const results = await driver.findElements(By.css('.search-result'));
      assert.ok(results.length > 0, 'No search results found');
      console.log('Test 2 Passed: Search results are valid.\n');
    }

    // Test 3: File Upload
    console.log('Running Test 3: File Upload...');
    if (driver) {
      await driver.get(`${websiteUrl}/file-upload`);
      const fileInput = await driver.findElement(By.id('file-upload')); // Replace with your actual ID
      const filePath = path.resolve(__dirname, 'example-file.txt'); // Update with your file's path
      await fileInput.sendKeys(filePath);

      const successMessage = await driver.wait(
        until.elementLocated(By.id('upload-success')), // Replace with your actual success message ID
        5000
      );
      const messageText = await successMessage.getText();
      assert.strictEqual(
        messageText,
        'File uploaded successfully!',
        'File upload message mismatch'
      );

      console.log('Test 3 Passed: File upload successful.\n');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Test Failed: ${error.message}`);
    } else {
      console.error('Test Failed: Unknown error');
    }
  } finally {
    if (driver) {
      await driver.quit(); // Check driver is not null before quitting
    }
  }
}

runTests();





// const websiteUrl = process.env.WEBSITE_URL || 'https://www.selenium.dev/selenium/web/web-form.html';

// import { Builder, By, WebDriver, until } from 'selenium-webdriver';
// import assert from 'assert';
// describe('First script', function () {
//     let driver: WebDriver;
  
//     before(async function () {
//       driver = await new Builder().forBrowser('chrome').build();
//     });
  
//     it('Test with environment variable for URL', async function () {
//         await driver.get(websiteUrl);
    
//         const title = await driver.getTitle();
//         console.log(`Page Title: ${title}`);
        
//         // Add your test steps here...
//         //1. Testing search
//         /*const searchInput = await driver.findElement(By.id("search-input"));
//         const searchButton = await driver.findElement(By.id("search-button"));

//         await searchInput.sendKeys("Test Query");
//         await searchButton.click();
//         await driver.wait(until.elementLocated(By.id("search-results")), 5000);

//         const results = await driver.findElements(By.css(".search-result"));
//         assert.ok(results.length > 0, "No search results found");

//         const firstResultText = await results[0].getText();
//         assert.ok(firstResultText.includes("Test Query"), "Search query not in results");*/

//         //2. Testing File upload

//         /*it("should upload a file", async function () {
//         // Navigate to your website
//         await driver.get("https://yourwebsite.com/file-upload");

//         const fileInput = await driver.findElement(By.id("file-upload"));
//         const filePath = path.resolve(__dirname, "example-file.txt");
//         await fileInput.sendKeys(filePath);

//         const successMessage = await driver.findElement(By.id("upload-success"));
//         const messageText = await successMessage.getText();
//         assert.strictEqual(messageText, "File uploaded successfully!");*/

//     });
  
//     after(async function () {
//       if (driver) {
//         await driver.quit();
//       }
//     });
//   });