import express from "express"
import { getChannel, historyChannel, postChannel } from "../controllers/controllers";

const router = express.Router();


router.post("/in/:channel",postChannel);
router.get("/events/:channel",getChannel);
router.get("/history/:channel",historyChannel);

export default router;
