import { test, expect } from '@playwright/test';

test.describe('App loads', () => {
  test('shows the home screen with title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: "Tina's Stupid Game" })).toBeVisible();
  });

  test('shows name input and create button', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible();
  });

  test('shows join section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Room code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join' })).toBeVisible();
  });
});

test.describe('Create Game flow', () => {
  test('shows error when name is empty', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Game' }).click();
    await expect(page.getByText('Enter your name')).toBeVisible();
  });

  test('creates a game and enters the lobby', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Your name').fill('TestPlayer');
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Should transition to lobby — look for room code display or lobby elements
    await expect(page.getByText(/Room:/i).or(page.getByText(/word/i))).toBeVisible({ timeout: 10_000 });

    // Cleanup: remove the test room from Firebase
    await page.waitForFunction(() => (window as any).__e2e, { timeout: 5_000 });
    await page.evaluate(async () => {
      const { db, ref, remove } = (window as any).__e2e;
      const code = localStorage.getItem('roomCode');
      if (code) {
        await remove(ref(db, `rooms/${code}`));
        localStorage.removeItem('roomCode');
      }
    });
  });
});

test.describe('Join Game flow', () => {
  test('shows error for empty name when joining', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Room code').fill('ABCD');
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByText('Enter your name')).toBeVisible();
  });

  test('shows error for invalid room code', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Your name').fill('TestPlayer');
    await page.getByPlaceholder('Room code').fill('AB');
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByText('Room code must be 4 letters')).toBeVisible();
  });

  test('shows error for non-existent room', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Your name').fill('TestPlayer');
    await page.getByPlaceholder('Room code').fill('ZZZZ');
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByText(/not found|failed/i)).toBeVisible({ timeout: 10_000 });
  });
});
