const express = require("express");

const {
  generateAIResponse,
  regenerateAIResponse,
} = require("../controllers/aiController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/:conversationId", protect, generateAIResponse);

router.post("/:conversationId/regenerate", protect, regenerateAIResponse);

module.exports = router;
