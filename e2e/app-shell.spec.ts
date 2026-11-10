import { expect, test } from '@playwright/test';

test.describe('App shell delivery', () => {
  test('loads the global design system instead of browser-default styling', async ({
    page,
  }) => {
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
    await expect(page.locator('main')).toHaveCSS('display', 'flex');
    await expect(
      page.getByRole('form', { name: 'Student ERP Authentication Form' })
    ).toBeVisible();
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
