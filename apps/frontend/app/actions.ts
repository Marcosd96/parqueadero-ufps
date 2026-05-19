"use server";

import prisma from "@parqueadero/database";
import { revalidatePath } from "next/cache";

export async function verifyPlate(plate: string, zone?: string) {
  // Verificación de doble entrada/salida
  if (zone) {
    const lastAccess = await prisma.accessLog.findFirst({
      where: { plate, status: true },
      orderBy: { timestamp: "desc" }
    });
    
    if (lastAccess) {
      const isEntering = zone.toLowerCase().includes("entrada");
      const wasEntering = lastAccess.zone.toLowerCase().includes("entrada");
      
      if (isEntering && wasEntering) {
        return { status: "unauthorized", reason: "El vehículo ya se encuentra dentro del parqueadero." };
      }
      
      const isExiting = zone.toLowerCase().includes("salida");
      const wasExiting = lastAccess.zone.toLowerCase().includes("salida");
      
      if (isExiting && wasExiting) {
         return { status: "unauthorized", reason: "El vehículo no se encuentra dentro del parqueadero." };
      }
    } else if (zone.toLowerCase().includes("salida")) {
      return { status: "unauthorized", reason: "El vehículo no se encuentra dentro del parqueadero (sin registro previo)." };
    }
  }

  // First, check for registered members
  const vehicle = await prisma.vehicle.findUnique({
    where: { plate },
    include: { owner: true }
  });

  if (vehicle) {
    if (vehicle.status.toLowerCase().includes("activo")) {
      let carnetUrl = null;
      if (vehicle.owner) {
        const reg = await prisma.userRegistration.findFirst({
          where: {
            OR: [
              { institutionalCode: vehicle.owner.cardnumber },
              { plate: vehicle.plate }
            ],
            status: "APROBADO"
          },
          orderBy: { createdAt: "desc" }
        });
        if (reg) {
          carnetUrl = reg.carnetFilePath;
        }
      }
      if (!carnetUrl) {
        const reg = await prisma.userRegistration.findFirst({
          where: { plate: vehicle.plate },
          orderBy: { createdAt: "desc" }
        });
        if (reg) {
          carnetUrl = reg.carnetFilePath;
        }
      }
      return { 
        status: "authorized", 
        type: "Estudiante/Personal", 
        ownerName: vehicle.owner ? `${vehicle.owner.firstname} ${vehicle.owner.surname}` : "Desconocido",
        carnetUrl
      };
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
    return { 
      status: "authorized", 
      type: "Visitante", 
      ownerName: guestRequest.requesterName, 
      carnetUrl: guestRequest.hostCarnetPath 
    };
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
    return { 
      status: "authorized", 
      type: registration.userType, 
      ownerName: registration.fullName, 
      carnetUrl: registration.carnetFilePath 
    };
  }

  return { status: "unauthorized", reason: "Vehículo no registrado o sin autorización vigente." };
}

export async function registerAccess(plate: string, granted: boolean, userType: string, zone: string) {
  if (granted) {
    const lastAccess = await prisma.accessLog.findFirst({
      where: { plate, status: true },
      orderBy: { timestamp: "desc" }
    });

    if (lastAccess) {
      const isEntering = zone.toLowerCase().includes("entrada");
      const wasEntering = lastAccess.zone.toLowerCase().includes("entrada");
      
      if (isEntering && wasEntering) {
        throw new Error("El vehículo ya se encuentra dentro del parqueadero.");
      }
      
      const isExiting = zone.toLowerCase().includes("salida");
      const wasExiting = lastAccess.zone.toLowerCase().includes("salida");
      
      if (isExiting && wasExiting) {
        throw new Error("El vehículo no se encuentra dentro del parqueadero.");
      }
    } else if (zone.toLowerCase().includes("salida")) {
      throw new Error("El vehículo no se encuentra dentro del parqueadero (sin registro previo).");
    }
  }

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

import { sendMail } from "@/lib/email";
import { guestRejectedEmailHtml } from "@/lib/email-templates";

export async function updateAccessRequestStatus(id: number, status: string, rfidTag?: string, rejectionReason?: string) {
  try {
    const request = await prisma.accessRequest.findUnique({ where: { id } });
    if (!request) return { success: false, error: "Solicitud no encontrada." };

    await prisma.accessRequest.update({
      where: { id },
      data: { status }
    });

    // Si se aprueba y se proporciona un TAG RFID, creamos un registro de vehículo temporal
    if ((status === "APROBADO" || status === "APPROVED") && rfidTag) {
      const normalizedTag = rfidTag.trim().toUpperCase();
      
      // Upsert para manejar si el visitante ya tiene un registro previo
      await prisma.vehicle.upsert({
        where: { plate: request.plateNumber },
        update: {
          rfidTag: normalizedTag,
          status: "Activo",
          department: "Visitante Temporal",
          brand: "VISITANTE",
          model: "TEMPORAL",
          color: "Gris",
          icon: "directions_car"
        },
        create: {
          plate: request.plateNumber,
          rfidTag: normalizedTag,
          status: "Activo",
          department: "Visitante Temporal",
          brand: "VISITANTE",
          model: "TEMPORAL",
          color: "Gris",
          icon: "directions_car"
        }
      });
    }

    let emailError: string | undefined;

    // Send email to host if rejected
    if (status === "RECHAZADO" && request.hostCode) {
      const host = await prisma.student.findUnique({
        where: { cardnumber: request.hostCode }
      });
      
      if (host) {
        const ufpsEmail = host.email?.endsWith("@ufps.edu.co") ? host.email : (host.emailpro?.endsWith("@ufps.edu.co") ? host.emailpro : host.email ?? host.emailpro);
        
        if (ufpsEmail) {
          try {
            await sendMail({
              to: ufpsEmail,
              subject: "❌ Solicitud de visitante rechazada",
              html: guestRejectedEmailHtml({
                guestName: request.requesterName,
                hostName: `${host.firstname} ${host.surname}`.trim(),
                plate: request.plateNumber,
                rejectionReason
              })
            });
          } catch (err) {
            console.error("[sendMail] Error sending guest rejection:", err);
            emailError = "Estado actualizado, pero hubo un error enviando el correo al anfitrión.";
          }
        }
      }
    }

    revalidatePath("/requests");
    revalidatePath("/vehicles");
    return { success: true, emailError };
  } catch (error) {
    console.error("Error updating access request status:", error);
    return { success: false, error: "No se pudo actualizar el estado de la solicitud o asignar el TAG." };
  }
}
