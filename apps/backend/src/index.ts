import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "@parqueadero/database";
import rfidRoutes from "./routes/rfid";
import lookupStudentRoutes from "./routes/lookup-student";
import seedRoutes from "./routes/seed";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use("/api/rfid", rfidRoutes);
app.use("/api/lookup-student", lookupStudentRoutes);
app.use("/api/seed", seedRoutes);

// Example route using Prisma
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", error: String(error) });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

export default app; // Exported for Vercel Serverless Functions
