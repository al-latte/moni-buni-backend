// Package imports
import express, { Request, Response, ErrorRequestHandler } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

//File imports
import connectToMongoDB from "./database/mongo.database";
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import categoryRoutes from "./routes/category.routes";
import walletRoutes from "./routes/wallet.routes";

// Variables
const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://moni-buni-frontend.onrender.com'
  : 'http://localhost:3000';

// Configurations
dotenv.config();

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.name === 'CORSError') {
    console.error('CORS Error:', err);
    res.status(403).json({
      error: 'CORS error',
      message: err.message
    });
    return;
  }
  next(err);
};

app.use(errorHandler);

app.use(express.json());
app.use(cookieParser());

app.get("/health", async (req: Request, res: Response) => {
  res.send({message: "Health OK!"})
})

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wallets", walletRoutes);

// Server
app.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server running on port ${PORT}`);
});

