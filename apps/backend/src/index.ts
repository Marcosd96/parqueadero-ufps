import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "@parqueadero/database";
import rfidRoutes from "./routes/rfid";
import lookupStudentRoutes from "./routes/lookup-student";
import seedRoutes from "./routes/seed";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman o el ESP32)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
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
