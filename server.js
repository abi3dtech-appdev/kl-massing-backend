import express from "express";
import cors from "cors";
import { getApsToken } from "./aps.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Allow JSON (we'll add raw GLB handling later)
app.use(express.json());
app.use(cors());

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "KL massing backend is running on Render"
  });
});

app.get("/aps-token", async (req, res) => {
  try {
    const token = await getApsToken();
    // Don't return the full token to the browser – just length for sanity
    res.json({
      status: "ok",
      message: "APS token acquired successfully",
      tokenLength: token.length
    });
  } catch (err) {
    console.error("APS token error:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to get APS token"
    });
  }
});

// Placeholder for massing upload (we'll implement later)
app.post("/kl-massing", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

app.listen(PORT, () => {
  console.log(`KL massing backend listening on port ${PORT}`);
});
