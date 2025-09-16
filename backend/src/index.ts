import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./utils/db";
import channelRoutes from "../routes/routes";
dotenv.config();
connectDB();
const port = 5000;

const app = express();

app.use(express.json());

const corsOptions ={
  origin:"http://localhost:5173/",
  credentials:true,
};
app.use(cors(corsOptions));  
app.use("/api",channelRoutes)

app.listen(port,()=>{
  console.log('Server is running in port 5000');
})



