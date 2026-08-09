const express = require("express");

const {
  createMessage,
  getMessages,
} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/:conversationId", protect, createMessage);

router.get("/:conversationId", protect, getMessages);

module.exports = router;
