import { processResearchQuery } from "../services/researchService.js";
import { analyzeReportUpload } from "../services/researchService.js";

export const handleResearchRequest = async (req, res) => {
  try {
    const {
      sessionId,
      patientName,
      disease,
      query,
      location,
      followUpMessage
    } = req.body;

    const result = await processResearchQuery({
      sessionId,
      patientName,
      disease,
      query,
      location,
      followUpMessage
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Research error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process research request"
    });
  }
};

export const handleReportAnalysisRequest = async (req, res) => {
  try {
    const result = await analyzeReportUpload(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("Report analysis error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze report"
    });
  }
};
