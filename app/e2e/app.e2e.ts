import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';
import path from 'path';

let electronApp: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  // Launch Electron app
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../dist/main/index.js')],
  });

  // Wait for the first window
  window = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test('should launch Electron app', async () => {
  expect(electronApp).toBeDefined();
});

test('should create a window', async () => {
  expect(window).toBeDefined();
  const title = await window.title();
  expect(title).toBe('Nori');
});

test('should render basic UI', async () => {
  // Wait for root element
  await window.waitForSelector('#root', { timeout: 5000 });

  // Check for expected content
  const content = await window.textContent('body');
  expect(content).toContain('Nori');
  expect(content).toContain('Node.js Backend');
});

test('should have API test buttons', async () => {
  const healthButton = await window.locator('#testHealth');
  const authButton = await window.locator('#testAuth');
  const roleButton = await window.locator('#testRole');
  const workspacesButton = await window.locator('#testWorkspaces');

  await expect(healthButton).toBeVisible();
  await expect(authButton).toBeVisible();
  await expect(roleButton).toBeVisible();
  await expect(workspacesButton).toBeVisible();
});

test('should handle health check API call', async () => {
  const healthButton = await window.locator('#testHealth');
  await healthButton.click();

  // Wait for result
  await window.waitForTimeout(500);

  const resultEl = await window.locator('#result');
  const resultText = await resultEl.textContent();

  // Should either show success or error (not empty)
  expect(resultText).toBeTruthy();
});
