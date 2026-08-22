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
    console.log("1. UPDATE ROUTE HIT");
    console.log("Conversation ID:", req.params.id);
    console.log("User:", req.user);
    console.log("Body:", req.body);

    const { id } = req.params;
    const { title } = req.body;

    console.log("2. Checking title");

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Conversation title is required",
      });
    }

    console.log("3. Searching conversation");

    const conversation = await Conversation.findOne({
      _id: id,
      user: req.user,
    });

    console.log("4. Conversation found:", conversation);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    console.log("5. Updating title");

    conversation.title = title.trim();

    console.log("6. Saving conversation");

    await conversation.save();

    console.log("7. Conversation saved");

    return res.status(200).json({
      success: true,
      message: "Conversation updated successfully!",
      conversation,
    });
  } catch (error) {
    console.error("UPDATE CONVERSATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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
