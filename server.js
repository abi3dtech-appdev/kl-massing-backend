import express from "express";
import cors from "cors";
import { getApsToken } from "./aps.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Global middleware
app.use(cors());
// JSON for normal routes (not /kl-massing)
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "KL massing backend is running on Render"
  });
});

// Test route: APS token
app.get("/aps-token", async (req, res) => {
  try {
    const token = await getApsToken();
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

/**
 * /kl-massing
 * Accepts a GLB file as application/octet-stream and just reports its size.
 * (Next step: we will send this GLB to the Forma Integrate API.)
 */
app.post(
  "/kl-massing",
  // Raw body parser ONLY for this route
  express.raw({ type: "application/octet-stream", limit: "30mb" }),
  async (req, res) => {
    try {
      // req.body is a Buffer
      const glbBuffer = req.body;

      if (!glbBuffer || !Buffer.isBuffer(glbBuffer)) {
        return res.status(400).json({
          status: "error",
          message: "No GLB binary received. Make sure Content-Type is application/octet-stream."
        });
      }

      console.log("Received GLB, bytes:", glbBuffer.length);

      // Sanity: try to get an APS token (we'll need it in next step)
      const token = await getApsToken();
      console.log("APS token length:", token.length);

      // For now, just echo back some info
      res.json({
        status: "ok",
        message: "GLB received on backend",
        bytes: glbBuffer.length
      });
    } catch (err) {
      console.error("Error in /kl-massing:", err);
      res.status(500).json({
        status: "error",
        message: err.message || "Internal server error"
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(`KL massing backend listening on port ${PORT}`);
});
