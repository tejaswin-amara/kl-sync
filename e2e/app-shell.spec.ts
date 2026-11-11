import { expect, test } from '@playwright/test';

test.describe('App shell delivery', () => {
  test('loads the global design system and responsive login shell', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const styles = await page.locator('body').evaluate((body) => {
      const computed = getComputedStyle(body);
      return {
        margin: computed.margin,
        fontFamily: computed.fontFamily,
      };
    });

    expect(styles.margin).toBe('0px');
    expect(styles.fontFamily).not.toContain('Times New Roman');
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('form[aria-labelledby="login-title"]')).toBeVisible();
    await expect(page.locator('#student-id-field')).toBeVisible();
    await expect(page.locator('#password-field')).toBeVisible();
    await expect(page.locator('#captcha-field')).toBeVisible();
    await expect(page.locator('.captcha-verification')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth + 1
    );
  });

  test('registers the service worker whether hydration runs before or after load', async ({
    page,
  }) => {
    await page.goto('/');

    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const registration =
              await navigator.serviceWorker.getRegistration();
            return registration?.active?.scriptURL ?? '';
          }),
        { timeout: 10000 }
      )
      .toContain('/sw.js');
  });
});
