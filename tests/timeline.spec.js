// @ts-check
const { test, expect } = require('@playwright/test');

const MOCK_KEY = 'sk-ant-test-key';

const MOCK_SUMMARY = {
  overview: {
    duration: '2 weeks',
    chief_complaint: 'Recurring headaches',
    entry_count: 1,
  },
  patterns: [{ observation: 'Morning pattern', detail: ': symptoms peak on waking' }],
  progression: { trend: 'stable', detail: 'No significant change across entries.' },
  questions: [
    { question: 'Could this be tension-related?', rationale: 'Stress correlation noted.' },
  ],
};

async function gotoWithKey(page) {
  await page.addInitScript((key) => {
    localStorage.setItem('st_api_key', key);
  }, MOCK_KEY);
  await page.goto('/');
  await expect(page.locator('#app')).toBeVisible();
}

async function addEntry(page, symptom, sev = 2) {
  await page.fill('#symptom-input', symptom);
  await page.locator(`.severity-pip.sev-${sev}`).click();
  await page.click('#entry-submit-btn');
}

test('API key gate is visible on fresh load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#api-key-gate')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
});

test('entering a key shows the app shell and empty state', async ({ page }) => {
  await page.goto('/');
  await page.fill('#api-key-input', MOCK_KEY);
  await page.click('#save-key-btn');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#empty-state')).toBeVisible();
});

test('adding an entry shows a timeline card and badge of 1', async ({ page }) => {
  await gotoWithKey(page);
  await addEntry(page, 'Headache');
  await expect(page.locator('#timeline-list .entry-card')).toHaveCount(1);
  await expect(page.locator('#entry-count-badge')).toHaveText('1');
});

test('adding a second entry updates badge to 2', async ({ page }) => {
  await gotoWithKey(page);
  await addEntry(page, 'Headache');
  await addEntry(page, 'Fatigue');
  await expect(page.locator('#timeline-list .entry-card')).toHaveCount(2);
  await expect(page.locator('#entry-count-badge')).toHaveText('2');
});

test('edit mode swaps heading and button label; cancel resets them', async ({ page }) => {
  await gotoWithKey(page);
  await addEntry(page, 'Headache');
  await page.click('[data-action="edit"]');
  await expect(page.locator('#form-heading-text')).toHaveText('Edit Symptom');
  await expect(page.locator('#submit-btn-label')).toHaveText('Update Entry');
  await page.click('#edit-cancel-btn');
  await expect(page.locator('#form-heading-text')).toHaveText('Log a Symptom');
  await expect(page.locator('#submit-btn-label')).toHaveText('Add to Timeline');
});

test('deleting an entry decrements the badge', async ({ page }) => {
  await gotoWithKey(page);
  await addEntry(page, 'Headache');
  await addEntry(page, 'Fatigue');
  await page.locator('[data-action="delete"]').first().click();
  await expect(page.locator('#entry-count-badge')).toHaveText('1');
});

test('Clear All dialog opens with backdrop; cancel leaves entries intact', async ({ page }) => {
  await gotoWithKey(page);
  await addEntry(page, 'Headache');
  await page.click('#clear-btn');
  await expect(page.locator('#clear-dialog')).toBeVisible();
  await expect(page.locator('#dialog-backdrop')).toBeVisible();
  await page.click('#clear-cancel-btn');
  await expect(page.locator('#clear-dialog')).toBeHidden();
  await expect(page.locator('#entry-count-badge')).toHaveText('1');
});

test('Prepare My Summary shows loading skeleton then renders mocked content', async ({ page }) => {
  await gotoWithKey(page);
  await addEntry(page, 'Headache');

  await page.route('https://api.anthropic.com/v1/messages', async (route) => {
    // small delay so loading skeleton is visible long enough to assert
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{ text: JSON.stringify(MOCK_SUMMARY) }],
      }),
    });
  });

  await page.click('#prepare-btn');
  await expect(page.locator('#summary-loading')).toBeVisible();
  await expect(page.locator('#summary-content')).toBeVisible();
  await expect(page.locator('#overview-content')).toContainText('Recurring headaches');
  await expect(page.locator('#patterns-list')).toContainText('Morning pattern');
  await expect(page.locator('#questions-list')).toContainText('Could this be tension-related?');
});
