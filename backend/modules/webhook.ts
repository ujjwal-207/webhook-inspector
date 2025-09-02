import mongoose from "mongoose";

const WebhookSchema = new mongoose.Schema({
  channel : String,
  method : String ,
  headers : String,
  body : Object,
  recivedAt :{type : Date ,default : Date.now}
});

WebhookSchema.index({receivedAt : 1},{expireAfterSeconds:86400});

export const Webhook = mongoose.model("Webhook",WebhookSchema);
