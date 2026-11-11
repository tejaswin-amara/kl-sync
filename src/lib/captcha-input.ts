export const KLU_CAPTCHA_MIN_LENGTH = 4;
export const KLU_CAPTCHA_MAX_LENGTH = 7;

const KLU_CAPTCHA_PATTERN = /^[a-z]{4,7}$/;

/**
 * Normalize user-entered ERP CAPTCHA text to the alphabet accepted by KLU.
 * This is a usability helper only; the server must still call isValidCaptchaInput.
 */
export function normalizeCaptchaInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '').slice(0, KLU_CAPTCHA_MAX_LENGTH);
}

/** Strict server-side validation: no trimming, casing conversion, or coercion. */
export function isValidCaptchaInput(value: unknown): value is string {
  return typeof value === 'string' && KLU_CAPTCHA_PATTERN.test(value);
}
