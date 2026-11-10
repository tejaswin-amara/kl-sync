import { expect, test } from '@playwright/test';

test.describe('Student login and CAPTCHA synchronization', () => {
  test('normalizes visual code, aligns the human-verification widget, and refreshes both challenges together', async ({
    page,
  }) => {
    const captchaResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/captcha') && response.status() === 200,
      { timeout: 15000 }
    );

    await page.goto('/');
    await captchaResponse;

    const studentIdInput = page.locator('#student-id-field');
    const passwordInput = page.locator('#password-field');
    const captchaInput = page.locator('#captcha-field');
    const submitButton = page.getByRole('button', { name: /^Sign in$/ });
    const image = page.getByAltText(
      'Distorted university security code. Enter the 4 to 7 lowercase letters shown.'
    );
    const refreshButton = page.getByRole('button', {
      name: /Refresh security code image and browser verification/i,
    });
    const widgetGroup = page.getByRole('group', {
      name: 'Browser security verification',
    });
    const widget = page.locator('cap-widget');

    await expect(studentIdInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(captchaInput).toBeVisible();
    await expect(image).toBeVisible();
    await expect(widget).toBeVisible();
    await expect(submitButton).toBeDisabled();
    await expect(captchaInput).toHaveValue('');

    // Client input normalization is lowercase ASCII a-z only.
    await captchaInput.fill('AB-CD 12');
    await expect(captchaInput).toHaveValue('abcd');

    // The custom element is centered inside its parent and cannot exceed it.
    const widgetBox = await widget.boundingBox();
    const groupBox = await widgetGroup.boundingBox();
    expect(widgetBox).not.toBeNull();
    expect(groupBox).not.toBeNull();
    expect(widgetBox!.x).toBeGreaterThanOrEqual(groupBox!.x - 1);
    expect(widgetBox!.x + widgetBox!.width).toBeLessThanOrEqual(
      groupBox!.x + groupBox!.width + 1
    );
    const pageWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(widgetBox!.x + widgetBox!.width).toBeLessThanOrEqual(pageWidth + 1);

    // A refresh invalidates both the text challenge and the previous CapJS
    // proof. A fresh image and fresh browser proof are required before login.
    await refreshButton.click();
    await expect(captchaInput).toHaveValue('');
    await expect(submitButton).toBeDisabled();
    await expect(image).toBeVisible();
    await expect(submitButton).toBeEnabled({ timeout: 15000 });

    await captchaInput.fill('ABCD');
    await expect(captchaInput).toHaveValue('abcd');
    await studentIdInput.fill('2100030000');
    await passwordInput.fill('TestPassword123');

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      submitButton.click(),
    ]);
    expect(page.url()).toContain('/dashboard');
  });

  test('rejects malformed visual codes in the browser before submission', async ({
    page,
  }) => {
    await page.goto('/');

    const captchaInput = page.locator('#captcha-field');
    const submitButton = page.getByRole('button', { name: /^Sign in$/ });

    await expect(submitButton).toBeDisabled();
    await captchaInput.fill('A!1');
    await expect(captchaInput).toHaveValue('a');
    await expect(submitButton).toBeDisabled();

    await captchaInput.fill('ABCDEFGH');
    await expect(captchaInput).toHaveValue('abcdefg');
    await expect(submitButton).toBeDisabled();
  });

  test('Remember Me and Explore Demo Portal remain usable', async ({ page }) => {
    const captchaResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/captcha') && response.status() === 200,
      { timeout: 15000 }
    );

    await page.goto('/');
    await captchaResponse;

    const rememberMeCheckbox = page.locator('#remember-me-checkbox');
    const demoPortalButton = page.getByRole('button', {
      name: /Explore Demo Portal/i,
    });

    await expect(rememberMeCheckbox).toBeVisible();
    await expect(rememberMeCheckbox).not.toBeChecked();
    await rememberMeCheckbox.check();
    await expect(rememberMeCheckbox).toBeChecked();

    await expect(demoPortalButton).toBeVisible();
    await expect(demoPortalButton).toBeEnabled();

    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      demoPortalButton.click(),
    ]);
    expect(page.url()).toContain('/dashboard');
  });

  test('provides keyboard-accessible spoken instructions without claiming audio challenge support', async ({
    page,
  }) => {
    await page.goto('/');

    const speakButton = page.getByRole('button', {
      name: 'Speak instructions',
    });
    await expect(speakButton).toBeVisible();
    await expect(speakButton).toBeEnabled();

    const captchaHelp = page.locator('#captcha-instructions');
    await expect(captchaHelp).toContainText(
      'Type the letters as shown'
    );
    await expect(captchaHelp).toContainText('Refresh the image');
  });
});
