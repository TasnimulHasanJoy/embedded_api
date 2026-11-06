require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const channelId = process.env.THINGSPEAK_CHANNEL_ID;
const readApiKey = process.env.THINGSPEAK_READ_API_KEY;

// These values live in memory and reset when the server restarts.
let wakeUpTime = null;
let systemStatus = "automatic";

const validStatuses = new Set(["open", "closed", "automatic", "system_on"]);

app.get("/", (req, res) => {
  res.json({
    name: "Circadian Blinds API",
    endpoints: [
      "GET /api/data",
      "GET /api/settings",
      "POST /api/wakeup-time",
      "POST /api/status",
    ],
  });
});

// Return the channel metadata and feed data from ThingSpeak as JSON.
app.get("/api/data", async (req, res) => {
  if (!channelId || channelId === "your_channel_id") {
    return res.status(503).json({
      error: "ThingSpeak is not configured. Set the channel ID in the .env file.",
    });
  }

  try {
    const response = await axios.get(
      `https://api.thingspeak.com/channels/${encodeURIComponent(channelId)}/feeds.json`,
      {
        params: {
          ...(readApiKey && readApiKey !== "your_read_api_key"
            ? { api_key: readApiKey }
            : {}),
          results: 8000,
        },
        timeout: 10000,
      }
    );

    res.json(response.data);
  } catch (error) {
    const status = error.response?.status === 404 ? 404 : 502;
    res.status(status).json({ error: "Could not retrieve data from ThingSpeak." });
  }
});

// Set wake-up time using 24-hour HH:MM format, for example {"time":"07:00"}.
app.post("/api/wakeup-time", (req, res) => {
  const time = req.body?.time;
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return res.status(400).json({ error: 'Send a time in HH:MM format, e.g. {"time":"07:00"}.' });
  }

  wakeUpTime = time;
  res.json({ wakeUpTime });
});

// Set blind/system status: open, closed, automatic, or system_on.
app.post("/api/status", (req, res) => {
  const status = req.body?.status;
  if (typeof status !== "string" || !validStatuses.has(status)) {
    return res.status(400).json({
      error: "Status must be one of: open, closed, automatic, system_on.",
    });
  }

  systemStatus = status;
  res.json({ status: systemStatus });
});

app.get("/api/settings", (req, res) => {
  res.json({ wakeUpTime, status: systemStatus });
});

app.listen(PORT, () => {
  console.log(`Circadian Blinds API listening on http://localhost:${PORT}`);
});

