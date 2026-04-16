import { processResearchQuery } from "../services/researchService.js";
import Session from "../models/Session.js";

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

    let finalDisease = disease || "";
    let finalLocation = location || "";
    let finalQuery = query || "";

    if (sessionId) {
      const existingSession = await Session.findById(sessionId);

      if (existingSession) {
        finalDisease = disease || existingSession.activeCondition || "";
        finalLocation = location || existingSession.activeLocation || "";

        if (followUpMessage && followUpMessage.trim()) {
          const cleanedFollowUp = followUpMessage.trim();
          finalQuery = `${cleanedFollowUp} in ${finalDisease}`.trim();
        } else {
          finalQuery = query || existingSession.activeQuery || "";
        }
      }
    }

    if (!sessionId && followUpMessage && followUpMessage.trim()) {
      finalQuery = followUpMessage.trim();
    }

    const result = await processResearchQuery({
      sessionId,
      patientName,
      disease: finalDisease,
      query: finalQuery,
      location: finalLocation
    });

    res.json({
      ...result,
      followUpMessage: followUpMessage || "",
      finalProcessedQuery: finalQuery
    });
  } catch (error) {
    console.error("Research error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while processing research request"
    });
  }
};