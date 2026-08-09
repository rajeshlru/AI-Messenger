const express = require("express");

const {
  createConversation,
  getConversations,
  updateConversation,
  deleteConversation,
} = require("../controllers/conversationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createConversation);

router.get("/", authMiddleware, getConversations);

router.patch("/:id", authMiddleware, updateConversation);

router.delete("/:id", authMiddleware, deleteConversation);

module.exports = router;
