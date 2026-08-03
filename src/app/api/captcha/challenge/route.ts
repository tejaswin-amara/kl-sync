import { generateChallenge } from "capjs-core";
import { NextResponse } from "next/server";

export async function POST() {
  const challenge = await generateChallenge(process.env.CAP_SECRET!, {
    scope: "login",
    expiresMs: 600_000, // 10 min to solve
  });

  return NextResponse.json(challenge);
}
