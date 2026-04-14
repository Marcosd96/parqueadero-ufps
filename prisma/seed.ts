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
  console.log("Starting seed...");

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

    console.log(`Found ${records.length} student records. Seeding...`);

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
      console.log(`Pushed records ${i} to ${i + batch.length} of ${studentsData.length}`);
    }
    console.log("Students seeded successfully.");
  } else {
    console.warn("estudiantes.csv not found, skipping student seed.");
  }

  // 3. Seed Vehicles
  const vehicles = [
    { plate: "PRK-8821", model: "Tesla Model 3", color: "Midnight Silver", icon: "directions_car", department: "Biomedical Engineering", status: "Active Permit" },
    { plate: "FLX-0092", model: "Ford F-150", color: "Oxford White", icon: "fire_truck", department: "Campus Operations", status: "Renewal Due" },
    { plate: "STU-1120", model: "Honda Accord", color: "Champagne Gold", icon: "directions_car", department: "School of Law", status: "Suspended" },
    { plate: "MTC-4401", model: "Yamaha MT-07", color: "Racing Blue", icon: "motorcycle", department: "Physical Education", status: "Active Permit" },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.create({ data: v });
  }

  // 4. Seed Access Requests
  const requests = [
    { requesterName: "Julianne Smith", plateNumber: "ABC-1234", visitDate: new Date("2023-10-24T08:00:00"), reason: "Guest Lecturer - Dept. of Physics", status: "PENDING" },
    { requesterName: "Marcus Reed", plateNumber: "XYZ-9876", visitDate: new Date("2023-10-24T10:00:00"), reason: "Contractor - HVAC Maintenance", status: "PENDING" },
    { requesterName: "Linda Bennett", plateNumber: "CAL-4421", visitDate: new Date("2023-10-25T09:00:00"), reason: "Alumni Relations Meeting", status: "PENDING" },
    { requesterName: "Thomas Hinds", plateNumber: "G-992211", visitDate: new Date("2023-10-25T13:00:00"), reason: "Prospective Faculty Interview", status: "PENDING" },
  ];

  for (const r of requests) {
    await prisma.accessRequest.create({ data: r });
  }

  // 5. Seed Access Logs
  const logs = [
    { timestamp: new Date("2023-10-24T14:22:15"), plate: "TX-882-PLT", userType: "Faculty", zone: "North Faculty (B-4)", status: true },
    { timestamp: new Date("2023-10-24T14:18:42"), plate: "CA-019-XKJ", userType: "Student", zone: "Central Student (C-1)", status: true },
    { timestamp: new Date("2023-10-24T14:15:09"), plate: "NY-911-ERR", userType: "Visitor", zone: "Main Gate", status: false },
    { timestamp: new Date("2023-10-24T14:05:33"), plate: "FL-330-MM9", userType: "Admin", zone: "Service Deck", status: true },
    { timestamp: new Date("2023-10-24T13:58:21"), plate: "TX-551-DOG", userType: "Student", zone: "South Overflow", status: true },
  ];

  for (const l of logs) {
    await prisma.accessLog.create({ data: l });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
