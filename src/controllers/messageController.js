const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const createMessage = async (req, res) => {
  try {
    const { content } = req.body;

    const { conversationId } = req.params;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      user: req.user,
      role: "user",
      content,
    });

    conversation.updatedAt = new Date();

    await conversation.save();

    res.status(201).json({
      success: true,
      message: "Message created successfully!",
      data: message,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversation: conversationId,
      user: req.user,
    }).sort({
      createdAt: 1,
    });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createMessage,
  getMessages,
};
