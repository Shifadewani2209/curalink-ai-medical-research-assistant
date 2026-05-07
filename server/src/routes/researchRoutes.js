import express from "express";
import {
  handleReportAnalysisRequest,
  handleResearchRequest
} from "../controllers/researchController.js";

const router = express.Router();

router.post("/", handleResearchRequest);
router.post("/report", handleReportAnalysisRequest);

export default router;
