import { test, expect } from '@playwright/test';

test.describe('Form Submissions & Auto-Solving CAPTCHAs', () => {
  test('Visual OCR CAPTCHA and Cap CAPTCHA auto-solve seamlessly on load and form submission', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/');

    // 2. Verify login form elements are present
    const studentIdInput = page.locator('#student-id-field');
    const passwordInput = page.locator('#password-field');
    const captchaInput = page.locator('#captcha-field');
    const submitBtn = page.getByRole('button', { name: /Continue to Dashboard/i });

    await expect(studentIdInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(captchaInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // 3. Verify Visual ERP OCR CAPTCHA auto-solves and populates captcha-field
    await expect(captchaInput).not.toHaveValue('', { timeout: 10000 });
    const visualCaptchaValue = await captchaInput.inputValue();
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
