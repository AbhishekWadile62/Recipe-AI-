const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const multer = require("multer");
const path = require("path");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

let searchHistory = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/image-generate", upload.single("imageFile"), async (req, res) => {
  const { spawn } = require("child_process");

  const process = spawn("python", ["yolo_detect.py", "image.jpg"]);

  process.stdout.on("data", (data) => {
    console.log(`Output: ${data}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });
});

router.post("/generate", async (req, res) => {
  const { ingredients, recipeName } = req.body;
  let prompt = "";

  if (recipeName) {
    prompt = `Give me a detailed recipe for ${recipeName}, including prep time, cook time, servings, ingredients, cooking methods, and tips.`;
  } else {
    prompt = `I have ${ingredients.join(
      ", "
    )}. Give me a recipe including prep time, cook time, servings, ingredients, cooking methods, and tips.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    searchHistory.push({ ingredients, recipeName, recipe: responseText });
    res.json({ recipe: responseText, history: searchHistory });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

router.get("/history", (req, res) => {
  res.json({ history: searchHistory });
});

module.exports = router;
