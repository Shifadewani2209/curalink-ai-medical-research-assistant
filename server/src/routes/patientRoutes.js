import express from "express";
import Patient from "../models/Patient.js";
import Session from "../models/Session.js";

const router = express.Router();

// Save or update patient context
router.post("/save", async (req, res) => {
  try {
    const { patientName, disease, location, currentMedications } = req.body;

    if (!patientName?.trim()) {
      return res.status(400).json({ message: "Patient name is required" });
    }

    let patient = await Patient.findOne({ patientName: patientName.trim() });

    if (!patient) {
      patient = new Patient({
        patientName: patientName.trim(),
        disease: disease || "",
        location: location || "",
        currentMedications: currentMedications || ""
      });
    } else {
      patient.disease = disease || "";
      patient.location = location || "";
      patient.currentMedications = currentMedications || "";
    }

    await patient.save();

    res.json({
      success: true,
      message: "Patient context saved successfully",
      patient
    });
  } catch (error) {
    console.error("Save patient error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all saved patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ updatedAt: -1 });
    res.json({ success: true, patients });
  } catch (error) {
    console.error("Fetch patients error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get patient sessions and chat history
router.get("/:patientName/history", async (req, res) => {
  try {
    const { patientName } = req.params;

    const sessions = await Session.find({ patientName })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error("Fetch history error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;