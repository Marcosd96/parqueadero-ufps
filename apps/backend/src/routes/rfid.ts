import { Router, Request, Response } from "express";
import prisma from "@parqueadero/database";

const router = Router();

// POST /api/rfid
// Llamado por el ESP32 al leer un TAG RFID
router.post("/", async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;

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
      // Registrar intento fallido en el log
      await prisma.accessLog.create({
        data: {
          plate: "UNKNOWN",
          rfidTag: normalizedUid,
          userType: "Desconocido",
          zone: "Portón Principal",
          status: false,
          method: "RFID",
        },
      });

      return res.json({ granted: false, reason: "TAG RFID no registrado en el sistema." });
    }

    const isActive =
      vehicle.status === "Permiso Activo" ||
      vehicle.status === "ACTIVO" ||
      vehicle.status === "Activo";

    const ownerName = vehicle.owner
      ? `${vehicle.owner.firstname} ${vehicle.owner.surname}`
      : "Propietario Genérico";

    // Registrar el acceso en el log
    await prisma.accessLog.create({
      data: {
        plate: vehicle.plate,
        rfidTag: normalizedUid,
        userType: "Estudiante/Personal",
        zone: "Portón Principal",
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
    });
  } catch (error) {
    console.error("[RFID API] Error:", error);
    return res.status(500).json({ granted: false, reason: "Error interno del servidor." });
  }
});
// GET /api/rfid/latest
// Usado por el frontend con polling para mostrar el último evento RFID
router.get("/latest", async (req: Request, res: Response) => {
  try {
    const latestLog = await prisma.accessLog.findFirst({
      where: { method: "RFID" },
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
      },
    });
  } catch (error) {
    console.error("[RFID Latest] Error:", error);
    return res.status(500).json({ event: null });
  }
});

export default router;
