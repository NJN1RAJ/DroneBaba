import express from "express";
import userRouter from "./routes/user.routes";
import locationDetRouter from "./routes/locationdet.routes";
import droneRouter from "./routes/drone.routes";
import { connectDB } from "./utils/connectDB";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cookieParser());

try {
  connectDB();
} catch (error) {
  console.log("failed to connect to DB");
}

app.use("/api/v1/user", userRouter);
app.use("/api/v1/locationdets", locationDetRouter);
app.use("/api/v1/drone", droneRouter);

app.listen(3000);
