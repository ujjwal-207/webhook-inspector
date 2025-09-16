import { Webhook } from "../modules/webhook";
import {Request, Response} from 'express';
const clients = new Map();
export const postChannel = async(req : Request,res : Response) => {
  try{
   const {channel} = req.params;
    const webhook = await Webhook.create({
      channel,
      method : req.method,
      headers : req.headers,
      body : req.body,
    })
const data = `data: ${JSON.stringify(webhook)}\n\n`;
  clients.get(channel)?.forEach((c:Response) => c.write(data));

  res.json({ status: "ok" });
  }catch(error){
    console.log("Error posting channel",error)
  }
}

export const getChannel = async(req : Request,res: Response) =>{
  try{
    const {channel} = req.params;

    res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
    });
    res.flushHeaders();
    if (!clients.has(channel)) clients.set(channel, new Set());
  clients.get(channel).add(res);

  req.on("close", () => {
    clients.get(channel)?.delete(res);
  });
  }catch(error){
    console.log("Error getting channel",error);
  }
}

export const historyChannel = async(req : Request,res : Response)=>{
  try{
    const{channel} = req.params;
    const history = await Webhook.find({channel}).sort({receivedAt : -1}).limit(50);
    res.json(history);
  }catch (error){
    console.log("Error fetching history",history);
  }
}
