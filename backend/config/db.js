import mongoose from "mongoose";
import { setMockDbMode } from "../utils/mockDb.js";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      setMockDbMode(true);
      console.warn("MONGO_URI is missing; starting in mock database mode.");
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    setMockDbMode(false);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    setMockDbMode(true);
    console.warn(`MongoDB unavailable, starting in mock database mode: ${error.message}`);
  }
};

export default connectDB;
