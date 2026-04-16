import express from "express";
import cors from "cors";
import researchRoutes from "./routes/researchRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/research", researchRoutes);

export default app;