import express from "express";
import cors from "cors";
import researchRoutes from "./routes/researchRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.use("/research", researchRoutes);
app.use("/patients", patientRoutes);

app.use((error, req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Report file is too large. Please upload a smaller text-based PDF or text report."
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Server error"
  });
});

export default app;
