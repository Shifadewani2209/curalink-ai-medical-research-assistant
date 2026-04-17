import express from "express";
import cors from "cors";
import researchRoutes from "./routes/researchRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/research", researchRoutes);
app.use("/patients", patientRoutes);

export default app;