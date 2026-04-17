import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    patientName: { type: String, default: "Unknown" },
    activeCondition: { type: String, default: "" },
    activeQuery: { type: String, default: "" },
    activeLocation: { type: String, default: "" },
    messages: { type: [messageSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);