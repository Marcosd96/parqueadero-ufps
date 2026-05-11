import { Router, Request, Response } from "express";
import prisma from "@parqueadero/database";

const router = Router();

/* ─── Rate limiting ──────────────────────────────────────────────────────────
   Simple in-memory rate limiter. Limits each IP to RATE_LIMIT requests per
   RATE_WINDOW_MS.
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

// GET /api/lookup-student?code=<cardnumber>
router.get("/", async (req: Request, res: Response) => {
  // --- Rate limit by IP ---
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." });
  }

  // --- Validate input ---
  const code = (req.query.code as string)?.trim();

  if (!code || code.length < 3 || code.length > 20) {
    return res.status(400).json({ error: "Código inválido" });
  }

  // Only allow alphanumeric codes to prevent injection attempts
  if (!/^[A-Z0-9a-z]+$/.test(code)) {
    return res.status(400).json({ error: "Código inválido" });
  }

  try {
    // --- Query ---
    const student = await prisma.student.findUnique({
      where: { cardnumber: code },
      select: { firstname: true, surname: true, email: true, emailpro: true },
    });

    if (!student) {
      // Return null (not found) without leaking whether the code exists
      return res.status(200).json(null);
    }

    // Pick the @ufps.edu.co email preferentially
    const ufpsEmail =
      student.email?.endsWith("@ufps.edu.co")
        ? student.email
        : student.emailpro?.endsWith("@ufps.edu.co")
        ? student.emailpro
        : student.email ?? student.emailpro ?? "";

    return res.status(200).json({
      fullName: `${student.firstname} ${student.surname}`.trim(),
      email: ufpsEmail,
    });
  } catch (error) {
    console.error("[Lookup Student Error]:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
