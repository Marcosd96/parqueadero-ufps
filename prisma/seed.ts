import { PrismaClient } from "../generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Iniciando seed...");

  // 1. Clear existing data
  await prisma.accessLog.deleteMany();
  await prisma.accessRequest.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.student.deleteMany();

  // 2. Load Students from CSV
  const csvPath = path.join(process.cwd(), "estudiantes.csv");
  if (fs.existsSync(csvPath)) {
    const fileContent = fs.readFileSync(csvPath, "latin1");
    const records = parse(fileContent, {
      delimiter: ";",
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Se encontraron ${records.length} registros de estudiantes. Sembrando...`);

    const studentsData = (records as Record<string, string>[]).map(record => ({
      cardnumber: record.cardnumber,
      firstname: record.firstname?.trim().toUpperCase() || "",
      surname: record.surname?.trim().toUpperCase() || "",
    }));

    const BATCH_SIZE = 5000;
    for (let i = 0; i < studentsData.length; i += BATCH_SIZE) {
      const batch = studentsData.slice(i, i + BATCH_SIZE);
      await prisma.student.createMany({
        data: batch,
        skipDuplicates: true, // Ignore duplicates instead of slow upserts
      });
      console.log(`Cargados registros ${i} a ${i + batch.length} de ${studentsData.length}`);
    }
    console.log("Estudiantes sembrados con éxito.");
  } else {
    console.warn("estudiantes.csv no encontrado, omitiendo siembra de estudiantes.");
  }

  // 3. Sembrar Vehículos
  const vehicles = [
    { plate: "PRK-8821", model: "Tesla Model 3", color: "Gris Medianoche", icon: "directions_car", department: "Ingeniería Biomédica", status: "Permiso Activo" },
    { plate: "FLX-0092", model: "Ford F-150", color: "Blanco Oxford", icon: "fire_truck", department: "Operaciones de Campus", status: "Renovación Pendiente" },
    { plate: "STU-1120", model: "Honda Accord", color: "Dorado Champagne", icon: "directions_car", department: "Facultad de Derecho", status: "Suspendido" },
    { plate: "MTC-4401", model: "Yamaha MT-07", color: "Azul Racing", icon: "motorcycle", department: "Educación Física", status: "Permiso Activo" },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.create({ data: v });
  }

  // 4. Sembrar Solicitudes de Acceso
  const requests = [
    { requesterName: "Julianne Smith", plateNumber: "ABC-1234", visitDate: new Date("2023-10-24T08:00:00"), reason: "Conferenciante Invitado - Depto. de Física", status: "PENDIENTE" },
    { requesterName: "Marcus Reed", plateNumber: "XYZ-9876", visitDate: new Date("2023-10-24T10:00:00"), reason: "Contratista - Mantenimiento HVAC", status: "PENDIENTE" },
    { requesterName: "Linda Bennett", plateNumber: "CAL-4421", visitDate: new Date("2023-10-25T09:00:00"), reason: "Reunión de Relaciones con Exalumnos", status: "PENDIENTE" },
    { requesterName: "Thomas Hinds", plateNumber: "G-992211", visitDate: new Date("2023-10-25T13:00:00"), reason: "Entrevista de Facultad Prospectiva", status: "PENDIENTE" },
  ];

  for (const r of requests) {
    await prisma.accessRequest.create({ data: r });
  }

  // 5. Sembrar Logs de Acceso
  const logs = [
    { timestamp: new Date("2023-10-24T14:22:15"), plate: "TX-882-PLT", userType: "Facultad", zone: "Facultad Norte (B-4)", status: true },
    { timestamp: new Date("2023-10-24T14:18:42"), plate: "CA-019-XKJ", userType: "Estudiante", zone: "Estudiante Central (C-1)", status: true },
    { timestamp: new Date("2023-10-24T14:15:09"), plate: "NY-911-ERR", userType: "Visitante", zone: "Portón Principal", status: false },
    { timestamp: new Date("2023-10-24T14:05:33"), plate: "FL-330-MM9", userType: "Administrador", zone: "Área de Servicio", status: true },
    { timestamp: new Date("2023-10-24T13:58:21"), plate: "TX-551-DOG", userType: "Estudiante", zone: "Desbordamiento Sur", status: true },
  ];

  for (const l of logs) {
    await prisma.accessLog.create({ data: l });
  }

  console.log("Seed completado con éxito.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
