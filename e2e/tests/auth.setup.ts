import { expect, test as setup } from '@playwright/test';
import { goToLoginPage, loginWith } from './helpers';

export const USER_FILE = 'playwright/.auth/user.json';
export const ADMIN_FILE = 'playwright/.auth/admin.json';
export const MANAGER_FILE = 'playwright/.auth/manager.json';

// The app stores the authenticated user in sessionStorage by default (rememberMe = false).
// sessionStorage does not persist across Playwright browser contexts, so we move the value
// to localStorage before saving the storageState — localStorage is persisted by Playwright.
const persistAuthToLocalStorage = async (page: import('@playwright/test').Page) => {
  await page.evaluate(() => {
    const user = sessionStorage.getItem('authenticatedUser');
    if (user) {
      localStorage.setItem('authenticatedUser', user);
      sessionStorage.removeItem('authenticatedUser');
    }
  });
};

setup('authenticate as user', async ({ page }) => {
  await goToLoginPage(page);
  await loginWith(page, { email: 'lea@mail.com', password: 'password' });
  await page.waitForURL(/\/$/);
  await persistAuthToLocalStorage(page);
  await page.context().storageState({ path: USER_FILE });
});

setup('authenticate as admin', async ({ page }) => {
  await goToLoginPage(page);
  await loginWith(page, {
    email: process.env.ADMIN_EMAIL ?? 'tibo@mail.com',
    password: process.env.ADMIN_PASSWORD ?? 'password',
  });
  await page.waitForURL(/\/$/);
  await expect(page.getByRole('button', { name: /admin/i })).toBeVisible();
  await persistAuthToLocalStorage(page);
  await page.context().storageState({ path: ADMIN_FILE });
});

setup('authenticate as manager', async ({ page }) => {
  await goToLoginPage(page);
  await loginWith(page, { email: 'seb@mail.com', password: 'password' });
  await page.waitForURL(/\/$/);
  await persistAuthToLocalStorage(page);
  await page.context().storageState({ path: MANAGER_FILE });
});
