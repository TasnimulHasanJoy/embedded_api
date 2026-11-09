require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const channelId = process.env.THINGSPEAK_CHANNEL_ID;
const readApiKey = process.env.THINGSPEAK_READ_API_KEY;
const writeApiKey = process.env.THINGSPEAK_WRITE_API_KEY;

const FIELD_BLIND_STATUS = "field4";
const FIELD_WAKE_UP_TIME = "field5";

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

async function writeThingSpeakField(field, value) {
  if (!channelId || channelId === "your_channel_id") {
    const error = new Error("ThingSpeak channel ID is not configured.");
    error.status = 503;
    throw error;
  }

  if (!writeApiKey || writeApiKey === "your_write_api_key") {
    const error = new Error("ThingSpeak Write API Key is not configured in .env.");
    error.status = 503;
    throw error;
  }

  const body = new URLSearchParams({ api_key: writeApiKey, [field]: value });
  const response = await axios.post("https://api.thingspeak.com/update.json", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 10000,
  });

  if (!response.data || Number(response.data.entry_id) === 0) {
    const error = new Error("ThingSpeak did not save the update. Check the Write API Key and channel update interval.");
    error.status = 429;
    throw error;
  }

  return response.data;
}

function sendThingSpeakError(res, error) {
  const status = error.status || 502;
  return res.status(status).json({
    error: error.message || "Could not write data to ThingSpeak.",
  });
}

// Set wake-up time using 24-hour HH:MM format, for example {"time":"07:00"}.
app.post("/api/wakeup-time", async (req, res) => {
  const time = req.body?.time;
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return res.status(400).json({ error: 'Send a time in HH:MM format, e.g. {"time":"07:00"}.' });
  }

  try {
    const entry = await writeThingSpeakField(FIELD_WAKE_UP_TIME, time);
    res.json({ message: "Wake-up time saved to ThingSpeak.", wakeUpTime: time, entryId: entry.entry_id });
  } catch (error) {
    sendThingSpeakError(res, error);
  }
});

// Set blind/system status: open, closed, automatic, or system_on.
app.post("/api/status", async (req, res) => {
  const status = req.body?.status;
  if (typeof status !== "string" || !validStatuses.has(status)) {
    return res.status(400).json({
      error: "Status must be one of: open, closed, automatic, system_on.",
    });
  }

  try {
    const entry = await writeThingSpeakField(FIELD_BLIND_STATUS, status);
    res.json({ message: "Blind/system status saved to ThingSpeak.", status, entryId: entry.entry_id });
  } catch (error) {
    sendThingSpeakError(res, error);
  }
});

app.get("/api/settings", async (req, res) => {
  if (!channelId || channelId === "your_channel_id") {
    return res.status(503).json({ error: "ThingSpeak channel ID is not configured in .env." });
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

    const feeds = response.data.feeds || [];
    const latestStatusFeed = [...feeds].reverse().find(
      (feed) => feed.field4 !== null && feed.field4 !== ""
    );
    const latestWakeUpFeed = [...feeds].reverse().find(
      (feed) => feed.field5 !== null && feed.field5 !== ""
    );
    res.json({
      wakeUpTime: latestWakeUpFeed?.field5 ?? null,
      status: latestStatusFeed?.field4 ?? null,
    });
  } catch (error) {
    const status = error.response?.status === 404 ? 404 : 502;
    res.status(status).json({ error: "Could not retrieve current settings from ThingSpeak." });
  }
});

app.listen(PORT, () => {
  console.log(`Circadian Blinds API listening on http://localhost:${PORT}`);
});

