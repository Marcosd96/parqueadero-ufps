import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();

  if (!code) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { cardnumber: code },
    select: { firstname: true, surname: true, email: true, emailpro: true },
  });

  if (!student) {
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
