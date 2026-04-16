import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    activeCondition: {
      type: String,
      default: ""
    },
    activeQuery: {
      type: String,
      default: ""
    },
    activeLocation: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;