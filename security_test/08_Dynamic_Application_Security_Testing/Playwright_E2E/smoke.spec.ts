import { test, expect } from '@playwright/test';

test('app loads and redirects to login', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  await expect(page).toHaveTitle(/PragatiX|SPDMS|Pragatix/i);
  await expect(page.locator('body')).toBeVisible();
});
