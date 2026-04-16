"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateRegistrationStatus(id: number, status: string) {
  try {
    // If approving, we need to create the permanent records
    if (status === "APROBADO") {
      await prisma.$transaction(async (tx) => {
        // 1. Get current registration data
        const reg = await tx.userRegistration.findUnique({
          where: { id },
        });

        if (!reg) throw new Error("Solicitud no encontrada.");
        if (reg.status !== "PENDIENTE") throw new Error("La solicitud ya fue procesada.");

        // 2. Split Name (Simple split: first word as firstname, rest as surname)
        const nameParts = reg.fullName.trim().split(/\s+/);
        const firstname = nameParts[0] || "Usuario";
        const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "S/A";

        // 3. Crear o encontrar estudiante
        const student = await tx.student.upsert({
          where: { cardnumber: reg.institutionalCode },
          update: {
            email: reg.email, // Asegurar que el correo electrónico se mantenga actualizado
          },
          create: {
            cardnumber: reg.institutionalCode,
            firstname,
            surname,
            email: reg.email,
          },
        });

        await tx.vehicle.upsert({
          where: { plate: reg.plate.toUpperCase().trim() },
          update: {
            ownerId: student.id,
            department: reg.userType,
            brand: reg.vehicleBrand,
            model: reg.vehicleModel || "N/A",
          },
          create: {
            plate: reg.plate.toUpperCase().trim(),
            ownerId: student.id,
            brand: reg.vehicleBrand,
            model: reg.vehicleModel || "N/A",
            color: "N/A",
            icon: "directions_car",
            department: reg.userType,
            status: "ACTIVO",
          },
        });

        await tx.userRegistration.update({
          where: { id },
          data: { status: "APROBADO" },
        });
      });
    } else {
      await prisma.userRegistration.update({
        where: { id },
        data: { status },
      });
    }

    revalidatePath("/solicitudes-registro");
    revalidatePath("/students");
    revalidatePath("/vehicles");
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating status:", error);
    const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el estado.";
    return { error: errorMessage };
  }
}
