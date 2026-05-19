import { Router, Request, Response } from "express";
import prisma from "@parqueadero/database";

const router = Router();

// Estado global para cuando solo se tiene un ESP32 físico
let globalActiveZone: "Entrada Principal" | "Salida Principal" = "Entrada Principal";

// GET /api/rfid/config - Obtener configuración actual
router.get("/config", (req, res) => {
  res.json({ globalActiveZone });
});

// POST /api/rfid/toggle-zone - Cambiar la zona activa para el lector único
router.post("/toggle-zone", (req, res) => {
  const { zone } = req.body;
  if (zone === "Salida Principal" || zone === "Entrada Principal") {
    globalActiveZone = zone;
    return res.json({ success: true, newZone: globalActiveZone });
  }
  globalActiveZone = globalActiveZone === "Entrada Principal" ? "Salida Principal" : "Entrada Principal";
  res.json({ success: true, newZone: globalActiveZone });
});

// POST /api/rfid/entrada - Atajo para entrada
router.post("/entrada", async (req: Request, res: Response) => {
  req.query.zone = "Entrada Principal";
  // Redirigir a la lógica principal (podríamos extraerla a una función, pero para mantenerlo simple re-inyectamos la zona)
  return handleRfidLogic(req, res);
});

// POST /api/rfid/salida - Atajo para salida
router.post("/salida", async (req: Request, res: Response) => {
  req.query.zone = "Salida Principal";
  return handleRfidLogic(req, res);
});

// POST /api/rfid - Lógica principal (mantenida por compatibilidad)
router.post("/", async (req: Request, res: Response) => {
  return handleRfidLogic(req, res);
});

async function handleRfidLogic(req: Request, res: Response) {
  try {
    const { uid } = req.body;
    // Prioridad: 1. Zona forzada en query, 2. Zona en body, 3. Zona en query original, 4. Estado global del sistema
    const zone = req.query.zone || req.body.zone;
    
    let activeZone: string = globalActiveZone; 
    
    // Si viene una zona específica, la normalizamos y usamos esa
    if (zone && typeof zone === "string") {
      if (zone.toLowerCase().includes("salida")) {
        activeZone = "Salida Principal";
      } else if (zone.toLowerCase().includes("entrada")) {
        activeZone = "Entrada Principal";
      } else {
        activeZone = zone; 
      }
    }

    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ granted: false, reason: "UID inválido o ausente." });
    }

    const normalizedUid = uid.trim().toUpperCase();

    // Buscar vehículo por TAG RFID
    const vehicle = await prisma.vehicle.findUnique({
      where: { rfidTag: normalizedUid },
      include: { owner: true },
    });

    if (!vehicle) {
      const logEntry = await prisma.accessLog.create({
        data: {
          plate: "UNKNOWN",
          rfidTag: normalizedUid,
          userType: "Desconocido",
          zone: activeZone,
          status: false,
          method: "RFID",
        },
      });

      return res.json({ 
        granted: false, 
        reason: "TAG RFID no registrado en el sistema.",
        debug: { activeZone, logId: logEntry.id }
      });
    }

    const isActive =
      vehicle.status === "Permiso Activo" ||
      vehicle.status === "ACTIVO" ||
      vehicle.status === "Activo";

    const isVisitor = vehicle.department === "Visitante Temporal";

    const ownerName = vehicle.owner
      ? `${vehicle.owner.firstname} ${vehicle.owner.surname}`
      : isVisitor ? "Invitado Externo" : "Propietario Genérico";

    // Verificación de doble entrada/salida
    const lastAccess = await prisma.accessLog.findFirst({
      where: { rfidTag: normalizedUid, status: true },
      orderBy: { timestamp: "desc" }
    });

    if (lastAccess) {
      const isEntering = activeZone.toLowerCase().includes("entrada");
      const wasEntering = lastAccess.zone.toLowerCase().includes("entrada");
      
      if (isEntering && wasEntering) {
        const logEntry = await prisma.accessLog.create({
          data: {
            plate: vehicle.plate,
            rfidTag: normalizedUid,
            userType: isVisitor ? "Visitante" : "Estudiante/Personal",
            zone: activeZone,
            status: false,
            method: "RFID",
          },
        });
        return res.json({
          granted: false,
          plate: vehicle.plate,
          ownerName,
          status: vehicle.status,
          reason: "El vehículo ya se encuentra dentro del parqueadero.",
          debug: { activeZone, logId: logEntry.id }
        });
      }
      
      const isExiting = activeZone.toLowerCase().includes("salida");
      const wasExiting = lastAccess.zone.toLowerCase().includes("salida");
      
      if (isExiting && wasExiting) {
        const logEntry = await prisma.accessLog.create({
          data: {
            plate: vehicle.plate,
            rfidTag: normalizedUid,
            userType: isVisitor ? "Visitante" : "Estudiante/Personal",
            zone: activeZone,
            status: false,
            method: "RFID",
          },
        });
        return res.json({
          granted: false,
          plate: vehicle.plate,
          ownerName,
          status: vehicle.status,
          reason: "El vehículo no se encuentra dentro del parqueadero.",
          debug: { activeZone, logId: logEntry.id }
        });
      }
    } else if (activeZone.toLowerCase().includes("salida")) {
      const logEntry = await prisma.accessLog.create({
        data: {
          plate: vehicle.plate,
          rfidTag: normalizedUid,
          userType: isVisitor ? "Visitante" : "Estudiante/Personal",
          zone: activeZone,
          status: false,
          method: "RFID",
        },
      });
      return res.json({
        granted: false,
        plate: vehicle.plate,
        ownerName,
        status: vehicle.status,
        reason: "El vehículo no se encuentra dentro del parqueadero (sin registro previo).",
        debug: { activeZone, logId: logEntry.id }
      });
    }

    // Registrar el acceso en el log
    const logEntry = await prisma.accessLog.create({
      data: {
        plate: vehicle.plate,
        rfidTag: normalizedUid,
        userType: isVisitor ? "Visitante" : "Estudiante/Personal",
        zone: activeZone,
        status: isActive,
        method: "RFID",
      },
    });

    if (!isActive) {
      return res.json({
        granted: false,
        plate: vehicle.plate,
        ownerName,
        status: vehicle.status,
        reason: `Vehículo con estado: ${vehicle.status}`,
        debug: { activeZone, logId: logEntry.id }
      });
    }

    return res.json({
      granted: true,
      plate: vehicle.plate,
      ownerName,
      vehicleModel: vehicle.model,
      vehicleBrand: vehicle.brand,
      vehicleColor: vehicle.color,
      department: vehicle.department,
      status: vehicle.status,
      debug: {
        activeZone,
        logId: logEntry.id,
        receivedZone: zone || "NONE"
      }
    });
  } catch (error) {
    console.error("[RFID API] Error:", error);
    return res.status(500).json({ granted: false, reason: "Error interno del servidor.", error: String(error) });
  }
}

// GET /api/rfid/latest
// Usado por el frontend con polling para mostrar el último evento RFID
router.get("/latest", async (req: Request, res: Response) => {
  try {
    const { zone } = req.query;
    
    let zoneFilter = zone as string;
    if (zoneFilter) {
      if (zoneFilter.toLowerCase().includes("salida")) zoneFilter = "Salida Principal";
      else if (zoneFilter.toLowerCase().includes("entrada")) zoneFilter = "Entrada Principal";
    }

    const whereClause: any = { method: "RFID" };
    if (zoneFilter) {
      whereClause.zone = {
        contains: zoneFilter,
        mode: "insensitive",
      };
    }

    const latestLog = await prisma.accessLog.findFirst({
      where: whereClause,
      orderBy: { timestamp: "desc" },
    });

    if (!latestLog) {
      return res.json({ event: null });
    }

    // Buscar info del vehículo si existe
    const vehicle =
      latestLog.plate !== "UNKNOWN"
        ? await prisma.vehicle.findUnique({
            where: { plate: latestLog.plate },
            include: { owner: true },
          })
        : null;

    let carnetUrl = null;
    if (vehicle) {
      let reg = null;
      if (vehicle.owner) {
        reg = await prisma.userRegistration.findFirst({
          where: {
            OR: [
              { institutionalCode: vehicle.owner.cardnumber },
              { plate: vehicle.plate }
            ],
            status: "APROBADO"
          },
          orderBy: { createdAt: "desc" }
        });
      }
      if (!reg) {
        reg = await prisma.userRegistration.findFirst({
          where: { plate: vehicle.plate },
          orderBy: { createdAt: "desc" }
        });
      }
      if (reg) {
        carnetUrl = reg.carnetFilePath;
      }
    }

    if (!carnetUrl && latestLog.plate !== "UNKNOWN") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const guestRequest = await prisma.accessRequest.findFirst({
        where: {
          plateNumber: latestLog.plate,
          status: "APPROVED",
          visitDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
      if (guestRequest) {
        carnetUrl = guestRequest.hostCarnetPath;
      }
    }

    if (!carnetUrl && latestLog.plate !== "UNKNOWN") {
      const reg = await prisma.userRegistration.findFirst({
        where: { plate: latestLog.plate, status: "APROBADO" },
        orderBy: { createdAt: "desc" }
      });
      if (reg) {
        carnetUrl = reg.carnetFilePath;
      }
    }

    return res.json({
      event: {
        id: latestLog.id,
        timestamp: latestLog.timestamp,
        plate: latestLog.plate,
        rfidTag: latestLog.rfidTag,
        granted: latestLog.status,
        ownerName: vehicle?.owner
          ? `${vehicle.owner.firstname} ${vehicle.owner.surname}`
          : null,
        vehicleModel: vehicle?.model ?? null,
        vehicleBrand: vehicle?.brand ?? null,
        vehicleColor: vehicle?.color ?? null,
        department: vehicle?.department ?? null,
        vehicleStatus: vehicle?.status ?? null,
        carnetUrl,
      },
    });
  } catch (error) {
    console.error("[RFID Latest] Error:", error);
    return res.status(500).json({ event: null });
  }
});

export default router;
