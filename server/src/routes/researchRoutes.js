import express from "express";
import { handleResearchRequest } from "../controllers/researchController.js";

const router = express.Router();

router.post("/", handleResearchRequest);

export default router;