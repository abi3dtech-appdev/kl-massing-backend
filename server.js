// --- NEW: GLB → Forma Integrate API → URN ---
app.post("/kl-massing", async (req, res) => {
  try {
    const glbBuffer = req.body;

    // Validate incoming GLB
    if (!Buffer.isBuffer(glbBuffer) || glbBuffer.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid GLB binary received"
      });
    }

    if (glbBuffer.length > 18 * 1024 * 1024) { // ~18MB safety margin (Forma limit ~20MB)
      return res.status(413).json({
        status: "error",
        message: "GLB file too large (max ~18MB)"
      });
    }

    console.log(`Received GLB: ${glbBuffer.length.toLocaleString()} bytes`);

    // APS token (string)
    const token = await getApsToken();
    if (!token) {
      throw new Error("Failed to obtain valid APS token");
    }

    // Project id MUST be passed via query: ?projectId=...
    const projectId = req.query.projectId;
    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Missing required 'projectId' query parameter"
      });
    }

    // Optional: custom name
    const name =
      req.query.name ||
      `KL Massing – ${new Date().toISOString().split("T")[0]}`;

    // Forma Integrate API – Create element from inline GLB (body shape must match docs)
    const integrateUrl =
      `https://developer.api.autodesk.com/forma/integrate/v1/projects/${projectId}/elements`;

    const requestBody = {
      data: {
        type: "elements",
        attributes: {
          provider: "external",
          name,
          category: "mass",
          representation: {
            type: "volumeMesh",
            format: "glb",
            data: glbBuffer.toString("base64")
          },
          transform: {
            translation: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 }
          }
        }
      }
    };

    console.log("Uploading to Forma Integrate API...", {
      projectId,
      name,
      glbSize: glbBuffer.length
    });

    const integrateResp = await fetch(integrateUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await integrateResp.text();
    let json;
    try {
      json = JSON.parse(responseText);
    } catch (e) {
      console.error("Forma returned non-JSON:", responseText);
      return res.status(502).json({
        status: "error",
        message: "Forma returned invalid JSON",
        raw: responseText.substring(0, 500)
      });
    }

    if (!integrateResp.ok) {
      console.error("Forma Integrate API error:", integrateResp.status, json);
      return res.status(502).json({
        status: "error",
        message: `Forma Integrate API failed: ${integrateResp.status}`,
        details: json.errors || json
      });
    }

    const elementUrn =
      json.data?.id || json.data?.attributes?.urn || json.urn;

    if (!elementUrn) {
      console.warn("No URN in successful response:", json);
      return res.status(500).json({
        status: "error",
        message: "Element created but no URN returned",
        raw: json
      });
    }

    console.log("Success! Forma element URN:", elementUrn);

    const formaLink = `https://forma.autodesk.com/projects/${projectId}?selectedElement=${elementUrn}`;

    res.json({
      status: "ok",
      message: "GLB successfully uploaded to Forma",
      projectId,
      elementUrn,
      formaLink,
      name
    });
  } catch (err) {
    console.error("Error in /kl-massing:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Unknown server error"
    });
  }
});
