import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";



const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if(/^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    if(allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],    
};

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors(corsOptions)); // Enable CORS with custom options
// app.options("*", cors(corsOptions)); // Enable pre-flight for all routes
//preflight means that the browser sends an initial request to the server to check if the actual request is safe to send. 
// This is done using the OPTIONS method, which is why we enable pre-flight for all routes.

app.use(express.json({limit: "1mb"})); // Increase the limit for JSON payloads

app.get("/api/health", (req, res) => {
  res.send({status: 'ok',
    time: new Date().toISOString()})    
});

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);

app.use(notFound);
app.use(errorHandler);

const PORTT = process.env.PORT || 8000;

// Connect to MongoDB and start the server
connectDB().then(() => {
  app.listen(PORTT, () => {
    console.log(`Server running on port ${PORTT}`);
  });
}).catch((error) => {
  console.error(`Failed to connect to MongoDB: ${error.message}`);
  process.exit(1);
});