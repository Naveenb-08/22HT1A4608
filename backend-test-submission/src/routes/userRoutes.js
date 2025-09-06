import express from "express";
import { logEvent } from "../../LoggingMiddleware/logger.js";

const router = express.Router();

// In-memory DB
const urlDB = {};

// Generate unique shortcode
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

// POST /shorturls - create short URL
router.post("/shorturls", async (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;

    if (!url || !/^https?:\/\/.+/.test(url)) {
      await logEvent("backend", "error", "route", "Invalid URL provided", process.env.ACCESS_TOKEN);
      return res.status(400).json({ error: "Invalid URL" });
    }

    let code = shortcode || generateShortCode();
    if (urlDB[code]) {
      return res.status(400).json({ error: "Shortcode already exists" });
    }

    const minutes = validity && Number.isInteger(validity) ? validity : 30;
    const expiry = new Date(Date.now() + minutes * 60000);

    urlDB[code] = {
      url,
      createdAt: new Date(),
      expiry,
      clicks: 0,
      clickData: []
    };

    await logEvent("backend", "info", "route", `Short URL created: ${code}`, process.env.ACCESS_TOKEN);

    res.status(201).json({
      shortLink: `http://localhost:${process.env.PORT || 3000}/${code}`,
      expiry: expiry.toISOString()
    });
  } catch (err) {
    await logEvent("backend", "error", "handler", `Error creating short URL: ${err.message}`, process.env.ACCESS_TOKEN);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /:shortcode - redirect
router.get("/:shortcode", async (req, res) => {
  try {
    const { shortcode } = req.params;
    const entry = urlDB[shortcode];

    if (!entry) {
      return res.status(404).json({ error: "Shortcode not found" });
    }

    if (new Date() > entry.expiry) {
      return res.status(410).json({ error: "Link expired" });
    }

    entry.clicks += 1;
    entry.clickData.push({
      timestamp: new Date(),
      referrer: req.get("Referrer") || "direct",
      ip: req.ip,
      location: "unknown" // could be extended with geo-ip service
    });

    await logEvent("backend", "info", "route", `Redirected shortcode: ${shortcode}`, process.env.ACCESS_TOKEN);

    res.redirect(entry.url);
  } catch (err) {
    await logEvent("backend", "error", "handler", `Error redirecting: ${err.message}`, process.env.ACCESS_TOKEN);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /shorturls/:shortcode - stats
router.get("/shorturls/:shortcode", async (req, res) => {
  try {
    const { shortcode } = req.params;
    const entry = urlDB[shortcode];

    if (!entry) {
      return res.status(404).json({ error: "Shortcode not found" });
    }

    const stats = {
      url: entry.url,
      createdAt: entry.createdAt,
      expiry: entry.expiry,
      clicks: entry.clicks,
      clickData: entry.clickData
    };

    await logEvent("backend", "info", "route", `Stats fetched for shortcode: ${shortcode}`, process.env.ACCESS_TOKEN);

    res.json(stats);
  } catch (err) {
    await logEvent("backend", "error", "handler", `Error fetching stats: ${err.message}`, process.env.ACCESS_TOKEN);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
