import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    disease: { type: String, default: "" },
    location: { type: String, default: "" },
    currentMedications: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Patient", patientSchema);