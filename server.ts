import { PrismaClient } from "@prisma/client";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Local imports
import router from "./routes";
import errorMiddleware from "./middleware/error-middleware";

const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/api", router);

app.use(errorMiddleware);
export const prismaClient = new PrismaClient();

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
