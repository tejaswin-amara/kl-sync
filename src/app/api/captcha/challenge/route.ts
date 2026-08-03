import { generateChallenge } from "capjs-core";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const secret =
      process.env.CAP_SECRET || "kl-sync-cap-secret-key-2026-production-fallback";
    const challenge = await generateChallenge(secret, {
      scope: "login",
      expiresMs: 600_000, // 10 min to solve
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Captcha challenge generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate captcha challenge" },
      { status: 500 }
    );
  }
}
