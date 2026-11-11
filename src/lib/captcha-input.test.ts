import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KLU_CAPTCHA_MAX_LENGTH,
  KLU_CAPTCHA_MIN_LENGTH,
  isValidCaptchaInput,
  normalizeCaptchaInput,
} from './captcha-input';

test('visual CAPTCHA input normalization lowercases and filters to ASCII a-z', () => {
  assert.equal(normalizeCaptchaInput('AB-CD 12'), 'abcd');
  assert.equal(normalizeCaptchaInput('AbCdEfGh'), 'abcdefg');
  assert.equal(normalizeCaptchaInput('  '), '');
});

test('visual CAPTCHA normalization never exceeds the upstream length limit', () => {
  assert.equal(KLU_CAPTCHA_MIN_LENGTH, 4);
  assert.equal(KLU_CAPTCHA_MAX_LENGTH, 7);
  assert.equal(normalizeCaptchaInput('abcdefghijk'), 'abcdefg');
});

test('server CAPTCHA validation accepts only 4–7 lowercase ASCII letters', () => {
  for (const value of ['abcd', 'abcdefg']) {
    assert.equal(isValidCaptchaInput(value), true);
  }

  for (const value of [
    '',
    'abc',
    'abcdefgh',
    'ABCD',
    'ab1d',
    'ab d',
    ' abcd',
    'abcd ',
    'ábcde',
    null,
    undefined,
    1234,
  ]) {
    assert.equal(isValidCaptchaInput(value), false);
  }
});
