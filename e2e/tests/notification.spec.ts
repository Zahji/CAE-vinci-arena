import { expect, test } from '@playwright/test';
import { goToNotificationPage } from './helpers';

const loginViaApi = async (
  request: import('@playwright/test').APIRequestContext,
  email: string,
) => {
  const response = await request.post('/api/auths/login', {
    data: { email, password: 'password' },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as { id: number; token: string };
};

test.describe('Notifications', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await goToNotificationPage(page);
  });

  // TC-N1: Page loads
  test('TC-N1: should display notifications page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /notifications/i }),
    ).toBeVisible();
  });

  // TC-N2: Empty state
  test('TC-N2: should show "Aucune notification" when no notifications', async ({ page }) => {
    const hasNotifications = await page.getByText(/aucune notification/i).isVisible();
    const hasNotificationItems = await page.locator('[class*="notification"]').count();
    expect(hasNotifications || hasNotificationItems > 0).toBeTruthy();
  });

  // TC-N3: Expand notification
  test('TC-N3: should expand notification on click', async ({ page }) => {
    const firstNotification = page.getByRole('heading', { level: 6 }).first();
    await expect(firstNotification).toBeVisible({ timeout: 5000 });
    await firstNotification.click();
    await expect(page.getByText('▲')).toBeVisible();
  });

  // TC-N4: Collapse notification on second click
  test('TC-N4: should collapse notification on second click', async ({ page }) => {
    const firstNotification = page.getByRole('heading', { level: 6 }).first();
    await expect(firstNotification).toBeVisible({ timeout: 5000 });
    await firstNotification.click();
    await expect(page.getByText('▲')).toBeVisible();
    await firstNotification.click();
    await expect(page.getByText('▼').first()).toBeVisible();
  });

  // TC-N5: Mark as read
  test('TC-N5: should mark notification as read', async ({ page, request }) => {
    const admin = await loginViaApi(
      request,
      process.env.ADMIN_EMAIL ?? 'tibo@mail.com',
    );
    const lea = await loginViaApi(request, 'lea@mail.com');
    const notificationObject = `E2E notification ${Date.now()}`;

    const createResponse = await request.post('/api/notifications/', {
      headers: { Authorization: admin.token },
      data: {
        userId: lea.id,
        object: notificationObject,
        message: 'Notification E2E à marquer comme lue.',
        type: 'GENERAL',
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    await page.reload();

    const generalNotification = page.getByRole('heading', {
      name: notificationObject,
      exact: true,
    });
    await expect(generalNotification).toBeVisible({ timeout: 5000 });
    await generalNotification.click();

    const markAsReadButton = page.getByRole('button', {
      name: /marquer comme lu/i,
    });
    await expect(markAsReadButton).toBeVisible();
    await markAsReadButton.click();
    await expect(markAsReadButton).not.toBeVisible();
  });

  // TC-N6: Team invitation buttons visible
  test('TC-N6: should show accept and decline buttons for team invitation', async ({ page }) => {
    const invitationNotification = page.getByRole('heading', { level: 6 })
      .filter({ hasText: /demande/i })
      .first();
    await expect(invitationNotification).toBeVisible({ timeout: 5000 });
    await invitationNotification.click();
    await expect(page.getByRole('button', { name: /accepter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /refuser/i })).toBeVisible();
  });

  // TC-N7: Decline dialog opens
  test('TC-N7: should open decline dialog when refuse button clicked', async ({ page }) => {
    const invitationNotification = page.getByRole('heading', { level: 6 })
      .filter({ hasText: /demande/i })
      .first();
    await expect(invitationNotification).toBeVisible({ timeout: 5000 });
    await invitationNotification.click();
    await page.getByRole('button', { name: /refuser/i }).click();
    await expect(
      page.getByRole('dialog', { name: /refuser la demande/i }),
    ).toBeVisible();
  });

  // TC-N8: Decline with empty reason shows error
  test('TC-N8: should show error when declining with empty reason', async ({ page }) => {
    const invitationNotification = page.getByRole('heading', { level: 6 })
      .filter({ hasText: /demande/i })
      .first();
    await expect(invitationNotification).toBeVisible({ timeout: 5000 });
    await invitationNotification.click();
    await page.getByRole('button', { name: /refuser/i }).click();
    await page.getByRole('button', { name: /confirmer le refus/i }).click();
    await expect(
      page.getByText(/veuillez entrer une raison/i),
    ).toBeVisible();
  });

    // TC-N10 but before TC-N9: Cancel decline dialog
  test('TC-N10: should close dialog when Annuler is clicked', async ({ page }) => {
    const invitationNotification = page.getByRole('heading', { level: 6 })
        .filter({ hasText: /demande/i })
        .first();
    await expect(invitationNotification).toBeVisible({ timeout: 5000 });
    await invitationNotification.click();
    await page.getByRole('button', { name: /refuser/i }).click();
    await expect(
        page.getByRole('dialog', { name: /refuser la demande/i }),
    ).toBeVisible();

    // scope Annuler to the dialog to avoid matching other buttons
    await page.getByRole('dialog').getByRole('button', { name: /annuler/i }).click();
    await expect(
        page.getByRole('dialog', { name: /refuser la demande/i }),
    ).not.toBeVisible();
  });

  // TC-N9: Decline with reason closes dialog
  test('TC-N9: should close dialog after declining with reason', async ({ page }) => {
    const invitationNotification = page.getByRole('heading', { level: 6 })
        .filter({ hasText: /demande/i })
        .first();
    await expect(invitationNotification).toBeVisible({ timeout: 5000 });
    await invitationNotification.click();
    await page.getByRole('button', { name: /refuser/i }).click();
    await page.getByLabel(/raison du refus/i).fill('Pas assez expérimenté');

    // scope confirm button to dialog to avoid ambiguity
    await page.getByRole('dialog').getByRole('button', { name: /confirmer le refus/i }).click();
    await expect(
        page.getByRole('dialog', { name: /refuser la demande/i }),
    ).not.toBeVisible();
  });

});
