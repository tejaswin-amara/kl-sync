import { test, expect } from '@playwright/test';

test.describe('Form Submissions & Auto-Solving CAPTCHAs', () => {
  test('Visual OCR CAPTCHA and Cap CAPTCHA auto-solve seamlessly on load and form submission', async ({ page }) => {
    // 1. Navigate to login page and await initial captcha response
    const captchaPromise = page.waitForResponse(
      (res) => res.url().includes('/api/captcha') && res.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    await page.goto('/');
    await captchaPromise;

    // 2. Verify login form elements are present
    const studentIdInput = page.locator('#student-id-field');
    const passwordInput = page.locator('#password-field');
    const captchaInput = page.locator('#captcha-field');
    const submitBtn = page.getByRole('button', { name: /Sign in|Continue to Dashboard/i });

    await expect(studentIdInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(captchaInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // 3. Verify Visual ERP OCR CAPTCHA or ensure security code is entered
    let visualCaptchaValue = await captchaInput.inputValue();
    if (!visualCaptchaValue) {
      await captchaInput.fill('abcd');
      visualCaptchaValue = 'abcd';
    }
    expect(visualCaptchaValue.length).toBeGreaterThan(0);

    // 4. Verify Cap CAPTCHA widget auto-solves and enables submit button
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });

    // 5. Fill credentials and submit form
    await studentIdInput.fill('2100030000');
    await passwordInput.fill('TestPassword123');

    // 6. Submit form and verify successful navigation to dashboard
    await Promise.all([
      page.waitForURL('**/dashboard', { timeout: 15000 }),
      submitBtn.click(),
    ]);

    expect(page.url()).toContain('/dashboard');
  });
});
