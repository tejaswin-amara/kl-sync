import { generateChallenge } from "capjs-core";
import { NextResponse } from "next/server";
import { getCapSecret } from "@/lib/captcha";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const secret = getCapSecret();
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
