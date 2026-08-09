const Conversation = require("../models/Conversation");

const createConversation = async (req, res) => {
  try {
    const title = req.body.title?.trim();

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Conversation title is required",
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Conversation title must not exceed 100 characters",
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Conversation title is required",
      });
    }

    const conversation = await Conversation.create({
      user: req.user,
      title,
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully!",
      conversation,
    });
  } catch (error) {
    console.error("Create Conversation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      user: req.user,
    }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Conversation title is required",
      });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      user: req.user,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    conversation.title = title.trim();
    conversation.updatedAt = new Date();

    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation updated successfully!",
      conversation,
    });
  } catch (error) {
    console.error("Update Conversation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Conversation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  updateConversation,
  deleteConversation,
};
