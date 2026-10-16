import { test, expect } from '@playwright/test';

// Smoke only: render + client-side wizard navigation. Never submits (no backend).

test('homepage renders an H1', async ({ page }) => {
  await page.goto('/de');
  await expect(page.locator('h1').first()).toBeVisible();
});

test('checkout wizard walks step 1 to step 4', async ({ page }) => {
  await page.goto('/de/checkout');
  await expect(page.getByText('Schritt 1 von 4')).toBeVisible();

  await page.getByRole('button', { name: /Weiter zu den Extras/ }).click();
  await expect(page.getByText('Schritt 2 von 4')).toBeVisible();

  await page.getByRole('button', { name: /Weiter zu den Daten/ }).click();
  await expect(page.getByText('Schritt 3 von 4')).toBeVisible();

  // Required contact fields, then advance.
  await page.getByLabel(/Vorname/).fill('Max');
  await page.getByLabel(/Nachname/).fill('Muster');
  await page.getByLabel('Email', { exact: false }).fill('max@example.ch');
  await page.getByRole('checkbox').first().check();

  await page.getByRole('button', { name: /Weiter zur Zahlung/ }).click();
  await expect(page.getByText('Schritt 4 von 4')).toBeVisible();
});
