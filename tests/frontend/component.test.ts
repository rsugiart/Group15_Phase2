// unit tests for react components
import { test, expect } from '@playwright/test';
import fs from 'fs';

test('homepage should have the correct title', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');

  // Verify the page title
  await expect(page).toHaveTitle("Internal Package Registry");

  // Check if a specific element is visible
  const header = page.locator('h1');
  await expect(header).toHaveText("Welcome to Group 15's Internal Package Registry");
});

test.describe('Login Page Tests', () => {
  test('should display the login form', async ({ page }) => {
    await page.goto('/login');

    // Verify form fields are present
    const usernameField = page.locator('input[placeholder="Username"]');
    const passwordField = page.locator('input[placeholder="Password"]');
    const loginButton = page.locator('button:has-text("Login")');

    await expect(usernameField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should show error messages for invalid input', async ({ page }) => {
    await page.goto('/login');

    const usernameField = page.locator('input[placeholder="Username"]');
    const passwordField = page.locator('input[placeholder="Password"]');
    const loginButton = page.locator('button:has-text("Login")');

    // Leave fields blank and click login
    await loginButton.click();

    // Expect error messages for both fields
    const usernameError = page.locator('.error-message', { hasText: 'Username must be at least 4 characters long.' });
    const passwordError = page.locator('.error-message', { hasText: 'Password must be at least 4 characters long.' });

    await expect(usernameError).toBeVisible();
    await expect(passwordError).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
  
    // Mock API response
    page.route('**/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isAdmin: true,
          permissions: ['read', 'write'],
          accessToken: 'Bearer mockAccessToken',
        }),
      });
    });
  
    // Fill in the hardcoded credentials
    await page.fill('input[placeholder="Username"]', 'test');
    await page.fill('input[placeholder="Password"]', 'test');
  
    // Click the login button
    await page.click('button:has-text("Login")');
  
    // Wait for the success message to appear
    const successMessage = page.locator('.success-message');
    await successMessage.waitFor({ timeout: 5000 });
  
    // Verify the success message text
    await expect(successMessage).toHaveText('Login successful! Redirecting...');
  
    // Wait for the redirection
    await page.waitForURL('/get-started', { timeout: 7000 });
  });  

  test('should display an error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    const usernameField = page.locator('input[placeholder="Username"]');
    const passwordField = page.locator('input[placeholder="Password"]');
    const loginButton = page.locator('button:has-text("Login")');

    // Enter invalid credentials
    await usernameField.fill('wrongUsername');
    await passwordField.fill('wrongPassword');

    // Mock API response
    page.route('**/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Username or password is invalid.',
        }),
      });
    });

    await loginButton.click();

    // Verify error message
    const errorMessage = page.locator('.error-message', { hasText: 'Username or password is invalid.' });
    await expect(errorMessage).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/login');

    const usernameField = page.locator('input[placeholder="Username"]');
    const passwordField = page.locator('input[placeholder="Password"]');
    const loginButton = page.locator('button:has-text("Login")');

    // Enter valid credentials
    await usernameField.fill('validUsername');
    await passwordField.fill('validPassword');

    // Mock API error
    page.route('**/login', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'An error occurred. Please try again later.',
        }),
      });
    });

    await loginButton.click();

    // Verify error message
    const errorMessage = page.locator('.error-message', { hasText: 'An error occurred. Please try again later.' });
    await expect(errorMessage).toBeVisible();
  });
});

test('should navigate to the "Get Started" page and verify content', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/get-started');

  // Verify the new page URL
  await expect(page).toHaveURL('/get-started');

  // Verify content on the "Get Started" page
  const getStartedHeader = page.locator('h1');
  await expect(getStartedHeader).toHaveText('Get Started with Group 15');
});

// test.describe('Get Started Page Tests', () => {
//   test.beforeEach(async ({ page }) => {
//     // Navigate to the login page
//     await page.goto('/login');

//     // Mock API response
//     page.route('**/login', (route) => {
//       route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({
//           isAdmin: true,
//           permissions: ['read', 'write'],
//           accessToken: 'Bearer mockAccessToken',
//         }),
//       });
//     });

//     // Fill in the hardcoded credentials
//     await page.fill('input[placeholder="Username"]', 'test');
//     await page.fill('input[placeholder="Password"]', 'test');

//     // Click the login button
//     await page.click('button:has-text("Login")');

//     // Wait for the success message to appear
//     const successMessage = page.locator('.success-message');
//     await successMessage.waitFor({ timeout: 5000 });

//     // Verify the success message text
//     await expect(successMessage).toHaveText('Login successful! Redirecting...');

//     // Wait for redirection to the Get Started page
//     await page.waitForURL('/get-started', { timeout: 7000 });
//   });

//   test('should navigate to the Search page automatically', async ({ page }) => {
//     // Programmatically click the "Go to Search Page" button
//     await page.locator('button:has-text("Go to Search Page")').click();

//     // Verify redirection to the Search page
//     await expect(page).toHaveURL('/search');
//   });

//   test('should navigate to the Upload page automatically', async ({ page }) => {
//     // Programmatically click the "Go to Upload Page" button
//     await page.locator('button:has-text("Go to Upload Page")').click();

//     // Verify redirection to the Upload page
//     await expect(page).toHaveURL('/upload');
//   });

//   test('should navigate to the Download page automatically', async ({ page }) => {
//     // Programmatically click the "Go to Download Page" button
//     await page.locator('button:has-text("Go to Download Page")').click();

//     // Verify redirection to the Download page
//     await expect(page).toHaveURL('/download');
//   });
// });

test.describe('Application Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Mock API response for login
    page.route('**/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isAdmin: true,
          permissions: ['read', 'write'],
          accessToken: 'Bearer mockAccessToken',
        }),
      });
    });

    // Fill in the hardcoded credentials
    await page.fill('input[placeholder="Username"]', 'test');
    await page.fill('input[placeholder="Password"]', 'test');

    // Click the login button
    await page.click('button:has-text("Login")');

    // Wait for the success message to appear
    const successMessage = page.locator('.success-message');
    await successMessage.waitFor({ timeout: 5000 });

    // Verify the success message text
    await expect(successMessage).toHaveText('Login successful! Redirecting...');

    // Wait for redirection to the Get Started page
    await page.waitForURL('/get-started', { timeout: 7000 });
  });

  // Get Started Page Tests
  test('should display the Get Started page title and options', async ({ page }) => {
    // Verify the title
    const title = page.locator('h1.get-started-title');
    await expect(title).toHaveText('Get Started with Group 15');

    // Verify the descriptive text
    const description = page.locator('p.get-started-text');
    await expect(description).toHaveText('Choose from the options below to explore our platform features.');
  });

  test('should navigate to the Search page from Get Started and verify search', async ({ page }) => {
    // Click the "Go to Search Page" button
    await page.locator('button:has-text("Go to Search Page")').click();

    // Verify redirection to the Search page
    await expect(page).toHaveURL('/search');

    // login again
    

    // Verify the title
    const title = page.locator('h1');
    await expect(title).toHaveText('Welcome to the Search Landing Page');

    // Verify the descriptive text
    const description = page.locator('p');
    await expect(description).toHaveText('Choose from the options below to explore our platform features.');

    // Click the "Get Rating" button
    await page.locator('button:has-text("Get Rating")').click();

    // Verify redirection to the Get Rating page
    await expect(page).toHaveURL('/search/get-rating');

    // go back to search
    await page.goBack();

      // Click the "Search by Version" button
    await page.locator('button:has-text("Search by Version")').click();

    // Verify redirection to the Search by Version page
    await expect(page).toHaveURL('/search/version-search');

    // go back to search
    await page.goBack();

    // Click the "Search by Regex" button
    await page.locator('button:has-text("Search by Regex")').click();

    // Verify redirection to the Search by Regex page
    await expect(page).toHaveURL('/search/regex-search');

    // go back to search
    await page.goBack();

    // Click the "View Registry" button
    await page.locator('button:has-text("View Registry")').click();

    // Verify redirection to the View Registry page
    await expect(page).toHaveURL('/search/view-registry');
  });

  test('should navigate to the Upload page from Get Started', async ({ page }) => {
    // Click the "Go to Upload Page" button
    await page.locator('button:has-text("Go to Upload Page")').click();

    // Verify redirection to the Upload page
    await expect(page).toHaveURL('/upload');
  });

  test('should navigate to the Download page from Get Started', async ({ page }) => {
    // Click the "Go to Download Page" button
    await page.locator('button:has-text("Go to Download Page")').click();

    // Verify redirection to the Download page
    await expect(page).toHaveURL('/download');
  });
});

test('should show "Not Found" for invalid routes', async ({ page }) => {
  // Navigate to a non-existent route
  await page.goto('/some-invalid-route');

  // Verify the "Not Found" page content
  const notFoundHeader = page.locator('h1');
  await expect(notFoundHeader).toHaveText("Not Found");
});