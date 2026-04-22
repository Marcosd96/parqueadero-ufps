"use server";

import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

// Support cars (ABC123, AB1234) and motorcycles (MGO18G, FJE62A)
const PLATE_REGEX = /^[A-Z]{2,3}[0-9]{2,4}[A-Z]?$/;

export async function submitRegistration(formData: FormData) {
  try {
    const userType = formData.get("userType") as string;
    const institutionalCode = (formData.get("institutionalCode") as string)?.trim();
    const plate = (formData.get("plate") as string).toUpperCase().trim();
    const vehicleBrand = (formData.get("vehicleBrand") as string) || null;
    const vehicleModel = (formData.get("vehicleModel") as string) || null;
    const carnetFile = formData.get("carnetFile") as File | null;
    const ownershipFile = formData.get("ownershipFile") as File | null;

    // --- Basic presence validations ---
    if (!userType || !institutionalCode || !plate) {
      return { error: "Todos los campos son obligatorios." };
    }

    // Cross-validation: Admin/Docente must start with '0', Students must NOT.
    const startsWithZero = institutionalCode.startsWith("0");
    if ((userType === "ADMINISTRATIVO" || userType === "DOCENTE") && !startsWithZero) {
      return { error: "Los códigos de administrativos y docentes deben empezar por '0'." };
    }
    if (userType === "ESTUDIANTE" && startsWithZero) {
      return { error: "Los códigos de estudiantes no deben empezar por '0'." };
    }

    if (!PLATE_REGEX.test(plate)) {
      return {
        error:
          "Formato de placa inválido. Use el formato colombiano (ABC123) o venezolano (AB1234).",
      };
    }

    if (!carnetFile || carnetFile.size === 0) {
      return { error: "Debes subir una imagen o PDF del carnet." };
    }

    if (!ownershipFile || ownershipFile.size === 0) {
      return { error: "Debes subir el documento de propiedad del vehículo." };
    }

    // --- Security: Re-query DB for authoritative name/email (don't trust client) ---
    // This prevents a malicious user from submitting a fake fullName/email via FormData.
    const studentRecord = await prisma.student.findUnique({
      where: { cardnumber: institutionalCode },
      select: { firstname: true, surname: true, email: true, emailpro: true },
    });

    let fullName: string;
    let email: string;

    if (studentRecord) {
      // Use authoritative data from DB
      fullName = `${studentRecord.firstname} ${studentRecord.surname}`.trim();
      const ufpsEmail =
        studentRecord.email?.endsWith("@ufps.edu.co")
          ? studentRecord.email
          : studentRecord.emailpro?.endsWith("@ufps.edu.co")
          ? studentRecord.emailpro
          : studentRecord.email ?? studentRecord.emailpro ?? "";
      email = ufpsEmail;
    } else {
      // Student not in the academic DB (new professor, admin, etc.) — use submitted values
      fullName = (formData.get("fullName") as string)?.trim();
      email = (formData.get("email") as string)?.trim();

      if (!fullName) return { error: "El nombre completo es obligatorio." };
      if (!email) return { error: "El correo es obligatorio." };
      if (!email.toLowerCase().endsWith("@ufps.edu.co")) {
        return { error: "El correo debe ser institucional (@ufps.edu.co)." };
      }
    }

    // --- Duplicate check: prevent spam and double-registrations ---
    const existing = await prisma.userRegistration.findFirst({
      where: {
        OR: [
          // Same plate already has an active or approved registration
          { plate, status: { in: ["PENDIENTE", "APROBADO"] } },
          // Same institutional code already has a pending request
          { institutionalCode, status: "PENDIENTE" },
        ],
      },
    });

    if (existing) {
      if (existing.plate === plate && existing.status === "APROBADO") {
        return { error: "Este vehículo (placa) ya tiene acceso aprobado al parqueadero." };
      }
      if (existing.plate === plate && existing.status === "PENDIENTE") {
        return { error: "Ya existe una solicitud pendiente para este vehículo. Espera la resolución." };
      }
      if (existing.institutionalCode === institutionalCode && existing.status === "PENDIENTE") {
        return { error: "Ya tienes una solicitud de registro pendiente. Espera la resolución antes de enviar otra." };
      }
    }

    // --- Save files to Vercel Blob ---
    const timestamp = Date.now();
    const safeName = fullName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    // Upload carnet
    const carnetBlob = await put(
      `registrations/${timestamp}-${safeName}/carnet.${carnetFile.name.split(".").pop() ?? "bin"}`,
      carnetFile,
      { access: "public" }
    );

    // Upload ownership document
    const ownershipBlob = await put(
      `registrations/${timestamp}-${safeName}/propiedad.${ownershipFile.name.split(".").pop() ?? "bin"}`,
      ownershipFile,
      { access: "public" }
    );

    // --- Create DB record ---
    await prisma.userRegistration.create({
      data: {
        userType,
        email,
        institutionalCode,
        fullName,
        plate,
        vehicleBrand,
        vehicleModel,
        carnetFilePath: carnetBlob.url,
        ownershipFilePath: ownershipBlob.url,
        status: "PENDIENTE",
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[submitRegistration]", err);
    return { error: "Ocurrió un error interno. Intenta nuevamente." };
  }
}

export async function submitGuestRegistration(formData: FormData) {
  try {
    const hostCode = (formData.get("hostCode") as string)?.trim();
    const guestName = (formData.get("guestName") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const plate = (formData.get("plate") as string || "N/A").toUpperCase().trim();
    const hostCarnetFile = formData.get("hostCarnetFile") as File | null;

    // --- Validations ---
    if (!hostCode || !guestName || !phone || !description) {
      return { error: "Todos los campos son obligatorios." };
    }

    // Verify host exists
    const host = await prisma.student.findUnique({
      where: { cardnumber: hostCode },
    });

    if (!host) {
      return { error: "El código del anfitrión no es válido o no está registrado." };
    }

    if (!hostCarnetFile || hostCarnetFile.size === 0) {
      return { error: "Debes subir el carnet del anfitrión." };
    }

    // --- Duplicate check: same guest + same host with pending status ---
    const existingGuest = await prisma.accessRequest.findFirst({
      where: {
        hostCode,
        requesterName: { equals: guestName, mode: "insensitive" },
        status: "PENDIENTE",
      },
    });

    if (existingGuest) {
      return { error: "Ya existe una solicitud pendiente para este invitado con el mismo anfitrión." };
    }

    // --- Save file to Vercel Blob ---
    const timestamp = Date.now();
    const safeName = guestName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    const carnetBlob = await put(
      `guests/${timestamp}-${safeName}/host_carnet.${hostCarnetFile.name.split(".").pop() ?? "bin"}`,
      hostCarnetFile,
      { access: "public" }
    );

    // --- Create DB record ---
    await prisma.accessRequest.create({
      data: {
        requesterName: guestName,
        plateNumber: plate,
        reason: description,
        phone,
        hostCode,
        hostCarnetPath: carnetBlob.url,
        status: "PENDIENTE",
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[submitGuestRegistration]", err);
    return { error: "Ocurrió un error interno. Intenta nuevamente." };
  }
}
