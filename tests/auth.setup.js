// @ts-check
import { test as setup } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage.js';

const AUTH_FILE = 'auth/dashboard.json';

setup('authenticate to Stripe dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginWithEnvCredentials();
  await page.context().storageState({ path: AUTH_FILE });
});
