import { expect, test } from '@playwright/test';

test.describe('Student login, image CAPTCHA, and browser verification', () => {
  test('keeps the mobile login usable and requires both current challenges', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Register API observers before navigation because CapJS may fetch its
    // challenge as soon as the custom element becomes visible.
    const challengeResult = page
      .waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/api/captcha/challenge',
        { timeout: 20000 }
      )
      .then(async (response) => ({
        status: response.status(),
        body: await response.text(),
      }));
    const redeemResult = page
      .waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/api/captcha/redeem',
        { timeout: 35000 }
      )
      .then(async (response) => ({
        status: response.status(),
        body: await response.text(),
      }));
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
    const submitButton = page.locator('button[type="submit"]');
    const image = page.locator('#kl-sync-captcha-image');
    const refreshButton = page.getByRole('button', {
      name: /Refresh university security-code image and browser verification/i,
    });
    const widget = page.locator('cap-widget');
    const widgetContainer = page.locator('.captcha-verification');

    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
    await expect(studentIdInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(captchaInput).toBeVisible();
    await expect(image).toBeVisible();
    await expect(widget).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // Input is normalized to lowercase ASCII letters only.
    await captchaInput.fill('AB-CD 12');
    await expect(captchaInput).toHaveValue('abcd');

    // The Cap widget remains inside its own width-constrained container.
    const widgetBox = await widget.boundingBox();
    const groupBox = await widgetContainer.boundingBox();
    expect(widgetBox).not.toBeNull();
    expect(groupBox).not.toBeNull();
    expect(widgetBox!.x).toBeGreaterThanOrEqual(groupBox!.x - 1);
    expect(widgetBox!.x + widgetBox!.width).toBeLessThanOrEqual(
      groupBox!.x + groupBox!.width + 1
    );

    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );

    // A refresh clears the text entry and replaces the visible Cap widget.
    await refreshButton.click();
    await expect(captchaInput).toHaveValue('');
    await expect(submitButton).toBeDisabled();
    await expect(image).toBeVisible();

    // CapJS owns an open shadow root. Activate its actual visible checkbox,
    // not the custom-element host (which does not forward click activation).
    // The React wrapper must not call widget.solve() on mount.
    const verifyCheckbox = widget.locator('.checkbox');
    await expect(verifyCheckbox).toBeVisible();
    await verifyCheckbox.click();
    await expect(widget).toHaveAttribute('data-cap-api-endpoint', '/api/captcha/');

    const challenge = await challengeResult;
    expect(
      challenge.status,
      `CapJS challenge response: ${challenge.body}`
    ).toBe(200);

    const redeem = await redeemResult;
    expect(
      redeem.status,
      `CapJS redeem response: ${redeem.body}`
    ).toBe(200);

    await expect(submitButton).toBeEnabled({ timeout: 30000 });

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

  test('rejects malformed or overlong codes before sign-in', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const captchaInput = page.locator('#captcha-field');
    const submitButton = page.locator('button[type="submit"]');

    await expect(submitButton).toBeDisabled();
    await captchaInput.fill('A!1');
    await expect(captchaInput).toHaveValue('a');
    await expect(submitButton).toBeDisabled();

    await captchaInput.fill('ABCDEFGH');
    await expect(captchaInput).toHaveValue('abcdefg');
    await expect(submitButton).toBeDisabled();

    await captchaInput.fill('ABCD');
    await expect(captchaInput).toHaveValue('abcd');
    await expect(submitButton).toBeDisabled();
  });

  test('Remember my student ID and demo access remain usable without CapJS login proof', async ({
    page,
  }) => {
    const captchaResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/captcha') && response.status() === 200,
      { timeout: 15000 }
    );

    await page.goto('/');
    await captchaResponse;

    const rememberMe = page.locator('#remember-me-checkbox');
    const demoButton = page.getByRole('button', {
      name: /Explore demo portal/i,
    });

    await expect(rememberMe).toBeVisible();
    await expect(rememberMe).not.toBeChecked();
    await rememberMe.check();
    await expect(rememberMe).toBeChecked();

    await expect(demoButton).toBeVisible();
    await expect(demoButton).toBeEnabled();
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      demoButton.click(),
    ]);
    expect(page.url()).toContain('/dashboard');
  });

  test('exposes keyboard-accessible CAPTCHA instructions and extension help', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const speakButton = page.getByRole('button', {
      name: 'Speak instructions',
    });
    await expect(speakButton).toBeVisible();
    await expect(speakButton).toBeEnabled();
    await expect(page.locator('#captcha-instructions')).toContainText(
      'not an audio code'
    );
    await expect(
      page.getByRole('link', { name: 'KLU ERP Auto-Fill' })
    ).toHaveAttribute(
      'href',
      'https://github.com/tejaswin-amara/klu-erp-autofill#installation'
    );
  });
});
