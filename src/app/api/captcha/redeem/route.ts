import { validateChallenge } from "capjs-core";
import { NextResponse } from "next/server";
import { consumeNonce, storeRedeemedToken } from "@/lib/captcha";

export async function POST(req: Request) {
  const body = await req.json();

  const result = await validateChallenge(process.env.CAP_SECRET!, body, {
    scope: "login",
    consumeNonce,
  });

  if (result.success && result.tokenKey) {
    await storeRedeemedToken(result.tokenKey, result.expires);
  }

  return NextResponse.json(result);
}
