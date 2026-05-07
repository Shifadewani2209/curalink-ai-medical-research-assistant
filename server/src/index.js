import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  connectDB().then((isDbConnected) => {
    if (!isDbConnected) {
      console.warn("MongoDB is unavailable. Patient history will be disabled until the connection is fixed.");
    }
  });
};

startServer();
