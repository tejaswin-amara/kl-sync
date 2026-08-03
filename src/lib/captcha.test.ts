import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import {
  verifyCaptchaToken,
  storeRedeemedToken,
  consumeNonce,
} from './captcha';

test('verifyCaptchaToken rejects missing or invalid tokens', async () => {
  assert.strictEqual(await verifyCaptchaToken(null), false);
  assert.strictEqual(await verifyCaptchaToken(undefined), false);
  assert.strictEqual(await verifyCaptchaToken(''), false);
  assert.strictEqual(
    await verifyCaptchaToken('invalid-token-without-colon'),
    false
  );
});

test('storeRedeemedToken and verifyCaptchaToken lifecycle (single-use token burn)', async () => {
  const challengeId = 'test-challenge-' + Date.now();
  const verToken = 'verification-secret-xyz';

  // Derive expected tokenKey matching verifyCaptchaToken internal logic:
  // sha256Hex(verToken)
  const hash = crypto
    .createHash('sha256')
    .update(verToken, 'utf-8')
    .digest('hex');
  const tokenKey = `${challengeId}:${hash}`;

  const expiresAt = Date.now() + 60000; // 1 min in future
  await storeRedeemedToken(tokenKey, expiresAt);

  const fullToken = `${challengeId}:${verToken}`;

  // First verification must succeed
  const firstCheck = await verifyCaptchaToken(fullToken);
  assert.strictEqual(firstCheck, true);

  // Second verification must fail (token burned on first check)
  const secondCheck = await verifyCaptchaToken(fullToken);
  assert.strictEqual(secondCheck, false);
});

test('consumeNonce enforces single-use nonces', async () => {
  const sigHex = 'nonce-sig-' + Math.random().toString(36).slice(2);
  const ttl = 10000;

  const firstConsume = await consumeNonce(sigHex, ttl);
  assert.strictEqual(firstConsume, true);

  // Replay attempt must return false
  const replayConsume = await consumeNonce(sigHex, ttl);
  assert.strictEqual(replayConsume, false);
});
