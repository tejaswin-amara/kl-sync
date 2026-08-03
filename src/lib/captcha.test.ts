import test from "node:test";
import assert from "node:assert";
import { verifyCaptchaToken } from "./captcha";

test("verifyCaptchaToken rejects missing or invalid tokens", async () => {
  assert.strictEqual(await verifyCaptchaToken(null), false);
  assert.strictEqual(await verifyCaptchaToken(undefined), false);
  assert.strictEqual(await verifyCaptchaToken(""), false);
  assert.strictEqual(await verifyCaptchaToken("invalid-token-without-colon"), false);
});
