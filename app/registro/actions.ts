"use server";

import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

// Support cars (ABC123, AB1234) and motorcycles (MGO18G, FJE62A)
const PLATE_REGEX = /^[A-Z]{2,3}[0-9]{2,4}[A-Z]?$/;

export async function submitRegistration(formData: FormData) {
  try {
    const userType = formData.get("userType") as string;
    const email = formData.get("email") as string;
    const institutionalCode = formData.get("institutionalCode") as string;
    const fullName = formData.get("fullName") as string;
    const plate = (formData.get("plate") as string).toUpperCase().trim();
    const vehicleBrand = (formData.get("vehicleBrand") as string) || null;
    const vehicleModel = (formData.get("vehicleModel") as string) || null;
    const carnetFile = formData.get("carnetFile") as File | null;
    const ownershipFile = formData.get("ownershipFile") as File | null;

    // --- Validations ---
    if (!userType || !email || !institutionalCode || !fullName || !plate) {
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

    if (!email.toLowerCase().endsWith("@ufps.edu.co")) {
      return { error: "El correo debe ser institucional (@ufps.edu.co)." };
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

    const carnetPath = carnetBlob.url;
    const ownershipPath = ownershipBlob.url;

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
        carnetFilePath: carnetPath,
        ownershipFilePath: ownershipPath,
        status: "PENDIENTE",
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[submitRegistration]", err);
    return { error: "Ocurrió un error interno. Intenta nuevamente." };
  }
}

