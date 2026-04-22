import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/* ─── Rate limiting ──────────────────────────────────────────────────────────
   Simple in-memory rate limiter. Limits each IP to RATE_LIMIT requests per
   RATE_WINDOW_MS. Imperfect in serverless (per-instance), but sufficient to
   prevent bulk enumeration attacks on a university parking system.
   ─────────────────────────────────────────────────────────────────────────── */
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 15;           // max requests per window
const RATE_WINDOW_MS = 60_000;   // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count++;
  return false;
}

/* ─── GET /api/lookup-student?code=<cardnumber> ─────────────────────────── */
export async function GET(request: NextRequest) {
  // --- Rate limit by IP ---
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      { status: 429 }
    );
  }

  // --- Validate input ---
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();

  if (!code || code.length < 3 || code.length > 20) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  // Only allow alphanumeric codes to prevent injection attempts
  if (!/^[A-Z0-9a-z]+$/.test(code)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  // --- Query ---
  const student = await prisma.student.findUnique({
    where: { cardnumber: code },
    select: { firstname: true, surname: true, email: true, emailpro: true },
  });

  if (!student) {
    // Return null (not found) without leaking whether the code exists
    return NextResponse.json(null, { status: 200 });
  }

  // Pick the @ufps.edu.co email preferentially
  const ufpsEmail =
    student.email?.endsWith("@ufps.edu.co")
      ? student.email
      : student.emailpro?.endsWith("@ufps.edu.co")
      ? student.emailpro
      : student.email ?? student.emailpro ?? "";

  return NextResponse.json({
    fullName: `${student.firstname} ${student.surname}`.trim(),
    email: ufpsEmail,
  });
}
