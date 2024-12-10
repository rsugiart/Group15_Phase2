// unit tests for react components
import { test, expect } from '@playwright/test';
import fs from 'fs';

test('homepage should have the correct title', async ({ page }) => {
  await page.coverage.startJSCoverage();

  // Navigate to the homepage
  await page.goto('/');

  // Verify the page title
  const title = await expect(page).toHaveTitle("React App");
  console.log(title);
  // Check if a specific element is visible
  const header = page.locator('h1');
  await expect(header).toHaveText("Welcome to Group 15's Internal Package Registry");
  const coverage = await page.coverage.stopJSCoverage();

  fs.mkdirSync('coverage', { recursive: true });
  fs.writeFileSync('coverage/coverage.json', JSON.stringify(coverage, null, 2));

});

test('should navigate to another page', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');

  // Click a link to navigate
  await page.click('a[href="/about"]');

  // Verify the new page URL
  await expect(page).toHaveURL('/about');

  // Verify content on the new page
  const aboutHeader = page.locator('h1');
  await expect(aboutHeader).toHaveText('About Us');
});


