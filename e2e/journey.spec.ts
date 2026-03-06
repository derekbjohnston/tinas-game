import { test, expect } from '@playwright/test';

/**
 * Full game journey test: a single-player host walks through every phase.
 * Uses window.__e2e (exposed in dev mode) to manipulate Firebase directly
 * for adding a fake second player and forcing turn order.
 */

async function waitForE2eHelpers(page: any) {
  await page.waitForFunction(() => (window as any).__e2e, { timeout: 10_000 });
}

test.describe('Full game journey', () => {
  test('host creates game, submits words, plays through all 3 rounds to results', async ({ page }) => {
    test.setTimeout(120_000);

    // ── HOME SCREEN ──
    await page.goto('/');
    await waitForE2eHelpers(page);
    // Clear any stale room code from previous test runs
    await page.evaluate(() => localStorage.removeItem('roomCode'));
    await page.reload();
    await waitForE2eHelpers(page);
    await expect(page.getByRole('heading', { name: "Tina's Stupid Game" })).toBeVisible();

    await page.getByPlaceholder('Your name').fill('Host');
    await page.getByRole('button', { name: 'Create Game' }).click();

    // ── LOBBY SCREEN ──
    await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible({ timeout: 15_000 });

    // Extract the room code
    const roomText = await page.getByText(/Room:/).textContent();
    const roomCode = roomText?.match(/Room:\s*([A-Z]{4})/)?.[1];
    expect(roomCode).toBeTruthy();

    // Submit 3 words
    const wordInputs = page.getByPlaceholder(/Word or saying/);
    await wordInputs.nth(0).fill('elephant');
    await wordInputs.nth(1).fill('banana');
    await wordInputs.nth(2).fill('spaceship');
    await page.getByRole('button', { name: 'Submit Words' }).click();

    await expect(page.getByText('Your words are in the bowl!')).toBeVisible({ timeout: 5_000 });

    // Add a fake second player with words via Firebase
    await page.evaluate(async (code: string) => {
      const { db, ref, update, push } = (window as any).__e2e;

      await update(ref(db, `rooms/${code}/players/fake-player-2`), {
        name: 'FakeBot',
        team: null,
        connected: true,
        submittedWords: false,
        skipsUsedRound1: 0,
      });

      const words = ['mountain', 'ocean', 'guitar'];
      const updates: Record<string, unknown> = {};
      for (const text of words) {
        const wordId = push(ref(db, `rooms/${code}/bowl`)).key!;
        updates[`rooms/${code}/bowl/${wordId}`] = {
          text,
          submittedBy: 'fake-player-2',
          inBowl: true,
        };
      }
      updates[`rooms/${code}/players/fake-player-2/submittedWords`] = true;
      await update(ref(db), updates);
    }, roomCode);

    // Host sees "Pick Teams" button
    await expect(page.getByRole('button', { name: /Pick Teams/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Pick Teams/i }).click();

    // ── TEAMS SCREEN ──
    await expect(page.getByRole('heading', { name: 'Pick Teams' })).toBeVisible({ timeout: 5_000 });

    // Host picks Team 1
    await page.getByRole('button', { name: 'Team 1' }).click();
    await expect(page.getByText("You're on Team 1")).toBeVisible({ timeout: 5_000 });

    // Put fake player on Team 2
    await page.evaluate(async (code: string) => {
      const { db, ref, update } = (window as any).__e2e;
      await update(ref(db, `rooms/${code}/players/fake-player-2`), { team: 2 });
    }, roomCode);

    // Start the game
    await expect(page.getByRole('button', { name: 'Start Game!' })).toBeEnabled({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Start Game!' }).click();

    // ── PLAY THROUGH 3 ROUNDS ──
    for (let round = 1; round <= 3; round++) {
      // Ensure host is the active player
      await page.evaluate(async (code: string) => {
        const { db, ref, get, update } = (window as any).__e2e;

        const hostId = localStorage.getItem('playerId');
        if (!hostId) return;

        const turnSnap = await get(ref(db, `rooms/${code}/turn`));
        const turn = turnSnap.val();
        if (turn?.activePlayerId !== hostId) {
          await update(ref(db, `rooms/${code}/turn`), {
            activePlayerId: hostId,
            activeTeam: 1,
            turnActive: false,
            currentWordId: null,
            wordsGuessedThisTurn: 0,
          });
        }
      }, roomCode);

      // Start Turn screen
      await expect(page.getByRole('button', { name: 'Start Turn' })).toBeVisible({ timeout: 10_000 });
      await page.getByRole('button', { name: 'Start Turn' }).click();

      // Gameplay screen — click "Got it!" for all words
      await expect(page.getByRole('button', { name: 'Got it!' })).toBeVisible({ timeout: 5_000 });

      let safety = 0;
      while (safety < 20) {
        safety++;
        const gotItBtn = page.getByRole('button', { name: 'Got it!' });

        const isVisible = await gotItBtn.isVisible().catch(() => false);
        if (!isVisible) break;

        const isEnabled = await gotItBtn.isEnabled().catch(() => false);
        if (!isEnabled) break;

        await gotItBtn.click();
        await page.waitForTimeout(400);
      }

      // Wait for round transition / game over
      await page.waitForTimeout(500);
    }

    // ── RESULTS SCREEN ──
    await expect(page.getByRole('heading', { name: 'Game Over!' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/wins!|tie/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Play Again/i })).toBeVisible();

    // ── CLEANUP: remove the test room from Firebase ──
    await page.evaluate(async (code) => {
      const { db, ref, remove } = (window as any).__e2e;
      await remove(ref(db, `rooms/${code}`));
      localStorage.removeItem('roomCode');
    }, roomCode!);
  });
});
