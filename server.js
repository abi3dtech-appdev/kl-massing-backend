import express from "express";
import cors from "cors";
import { getApsToken } from "./aps.js";

const app = express();
const PORT = process.env.PORT || 4000;

// --- middlewares ---
app.use(cors());

// JSON is still fine for non-GLB routes
app.use(express.json());

// Raw parser for GLB uploads ONLY
app.use("/kl-massing", express.raw({ type: "application/octet-stream", limit: "20mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "KL massing backend is running on Render"
  });
});

// APS token test (already working)
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

// NEW: GLB -> Integrate API -> URN
app.post("/kl-massing", async (req, res) => {
  try {
    const glbBuffer = req.body;
    if (!Buffer.isBuffer(glbBuffer) || glbBuffer.length === 0) {
      return res.status(400).json({ status: "error", message: "No GLB binary received" });
    }

    console.log("Received GLB bytes:", glbBuffer.length);

    const token = await getApsToken();

    // TODO: fill in the correct body according to the Forma Integrate docs
    // Docs: https://aps.autodesk.com/en/docs/forma/v1/reference (Integrate API -> Create element)
    const body = {
      // This is a SKELETON — you must adapt to the exact element schema you choose.
      // Example concept (NOT final):
      //
      // provider: "external",   // or your chosen provider id
      // representation: {
      //   type: "volumeMesh",
      //   glb: glbBuffer.toString("base64")  // or a URL to a GLB file you host
      // }
    };

    // For now we throw if you haven’t filled the body
    if (Object.keys(body).length === 0) {
      throw new Error("Integrate API request body not defined. Fill the TODO in server.js.");
    }

    const integrateResp = await fetch(
      "https://developer.api.autodesk.com/forma/integrate/v1/elements",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    if (!integrateResp.ok) {
      const text = await integrateResp.text();
      console.error("Integrate API error:", integrateResp.status, text);
      return res.status(502).json({
        status: "error",
        message: `Integrate API failed: ${integrateResp.status} ${integrateResp.statusText}`,
        details: text
      });
    }

    const json = await integrateResp.json();
    // Depending on spec this may be json.id, json.urn, or json.element.urn – check docs.
    const urn = json.urn || json.id || (json.element && json.element.urn);

    if (!urn) {
      console.warn("Integrate API response without obvious URN:", json);
      return res.status(500).json({
        status: "error",
        message: "Integrate API response did not contain a URN",
        raw: json
      });
    }

    console.log("Created Forma element with URN:", urn);
    res.json({
      status: "ok",
      message: "GLB registered as Forma element",
      urn
    });

  } catch (err) {
    console.error("Error in /kl-massing:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Unknown error in /kl-massing"
    });
  }
});

app.listen(PORT, () => {
  console.log(`KL massing backend listening on port ${PORT}`);
});
