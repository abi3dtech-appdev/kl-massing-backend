import express from "express";
import cors from "cors";

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

// Placeholder for massing upload (we'll implement later)
app.post("/kl-massing", (req, res) => {
  res.status(501).json({ error: "Not implemented yet" });
});

app.listen(PORT, () => {
  console.log(`KL massing backend listening on port ${PORT}`);
});
