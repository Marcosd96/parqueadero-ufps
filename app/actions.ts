"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function verifyPlate(plate: string) {
  // First, check for registered members
  const vehicle = await prisma.vehicle.findUnique({
    where: { plate },
    include: { owner: true }
  });

  if (vehicle) {
    if (vehicle.status === "ACTIVO" || vehicle.status === "Activo") {
      return { status: "authorized", type: "Estudiante/Personal", ownerName: vehicle.owner ? `${vehicle.owner.firstname} ${vehicle.owner.surname}` : "Desconocido" };
    } else {
      return { status: "unauthorized", reason: `Vehículo con estado: ${vehicle.status}` };
    }
  }

  // Next, check for guest AccessRequest
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const guestRequest = await prisma.accessRequest.findFirst({
    where: {
      plateNumber: plate,
      status: "APPROVED",
      visitDate: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (guestRequest) {
    return { status: "authorized", type: "Visitante", ownerName: guestRequest.requesterName };
  }

  // Also check UserRegistration in case they are approved but not yet in Vehicle? 
  // No, if they are APROBADO they should be in Vehicle. But just in case:
  const registration = await prisma.userRegistration.findFirst({
    where: {
      plate: plate,
      status: "APROBADO"
    }
  });

  if (registration) {
    return { status: "authorized", type: registration.userType, ownerName: registration.fullName };
  }

  return { status: "unauthorized", reason: "Vehículo no registrado o sin autorización vigente." };
}

export async function registerAccess(plate: string, granted: boolean, userType: string, zone: string) {
  await prisma.accessLog.create({
    data: {
      plate,
      status: granted,
      userType,
      zone,
    }
  });

  revalidatePath("/");
  revalidatePath("/reports");
}
