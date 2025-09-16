import { Webhook } from "../modules/webhook";
import { Request, Response } from "express";

const clients = new Map<string, Set<Response>>();

export const postChannel = async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;
    const webhook = await Webhook.create({
      channel,
      method: req.method,
      headers: req.headers,
      body: req.body,
      receivedAt: new Date()
    });

    const data = `data: ${JSON.stringify(webhook)}\n\n`;
    clients.get(channel)?.forEach((c: Response) => c.write(data));

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error posting channel", error);
    res.status(500).json({ error: "Failed to post webhook" });
  }
};

export const getChannel = async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;

    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    res.flushHeaders();

    if (!clients.has(channel)) clients.set(channel, new Set());
    clients.get(channel)!.add(res);

    req.on("close", () => {
      const set = clients.get(channel);
      if (set) {
        set.delete(res);
        if (set.size === 0) clients.delete(channel);
      }
    });
  } catch (error) {
    console.error("Error getting channel", error);
    res.status(500).json({ error: "Failed to subscribe to channel" });
  }
};

export const historyChannel = async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;
    const history = await Webhook.find({ channel })
      .sort({ receivedAt: -1 }) // or createdAt if using timestamps
      .limit(50);
    res.json(history);
  } catch (error) {
    console.error("Error fetching history", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

