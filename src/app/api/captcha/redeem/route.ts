import { validateChallenge } from "capjs-core";
import { NextResponse } from "next/server";
import { consumeNonce, storeRedeemedToken } from "@/lib/captcha";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const secret =
      process.env.CAP_SECRET || "kl-sync-cap-secret-key-2026-production-fallback";

    const result = await validateChallenge(secret, body, {
      scope: "login",
      consumeNonce,
    });

    if (result.success && result.tokenKey) {
      await storeRedeemedToken(result.tokenKey, result.expires);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Captcha redemption failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to redeem captcha token" },
      { status: 500 }
    );
  }
}
