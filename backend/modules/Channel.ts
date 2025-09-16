import mongoose from "mongoose";

const channelSchema = new mongoose.Schema({
  code : {type : String , unique : true},
  createdAt : {type : Date , default : Date.now }
});

export const Channel = mongoose.model("Channel",channelSchema); 
