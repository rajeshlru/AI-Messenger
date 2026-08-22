const Groq = require("groq-sdk");

const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const UploadedFile = require("../models/UploadedFile");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const AI_MODELS = [
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "groq/compound",
  "groq/compound-mini",
];

const VISION_MODELS = [
  "qwen/qwen3.6-27b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
];

const generateVisionWithFallback = async (messages, temperature = 0.7) => {
  let lastError = null;

  for (const model of VISION_MODELS) {
    try {
      console.log(`Trying vision model: ${model}`);

      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature,
        max_tokens: 1000,
      });

      console.log(`Vision response generated using: ${model}`);

      return completion;
    } catch (error) {
      lastError = error;

      console.error(`Vision model failed: ${model}`);

      console.error(
        error?.error?.message || error?.message || "Unknown vision model error",
      );

      console.log("Trying next vision model...");
    }
  }

  throw lastError;
};

const createImageDataUrl = (file) => {
  if (!file?.fileData || !file?.mimeType) {
    return null;
  }

  const base64 = Buffer.from(file.fileData).toString("base64");

  return `data:${file.mimeType};base64,${base64}`;
};

const generateWithFallback = async (messages, temperature = 0.7) => {
  let lastError = null;

  for (const model of AI_MODELS) {
    try {
      console.log(`Trying AI model: ${model}`);

      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature,
        max_tokens: 1000,
      });

      console.log(`AI response generated using: ${model}`);

      return completion;
    } catch (error) {
      lastError = error;

      console.error(`Model failed: ${model}`);

      console.error(
        error?.error?.message || error?.message || "Unknown AI model error",
      );

      console.log("Trying next AI model...");
    }
  }

  throw lastError;
};

const createDisplayTitle = (content) => {
  if (!content || !content.trim()) {
    return "New conversation";
  }

  const words = content.trim().split(/\s+/);

  if (words.length <= 5) {
    return words.join(" ");
  }

  return words.slice(0, 5).join(" ") + "...";
};

const createFileContext = (uploadedFiles) => {
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return "";
  }

  return uploadedFiles
    .map((file) => {
      return `
UPLOADED FILE

File name: ${file.originalName}
File type: ${file.mimeType}

FILE CONTENT:
${file.extractedText}

END OF FILE
`;
    })
    .join("\n\n");
};

const generateAIResponse = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    if (content.trim().length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please keep it under 10,000 characters.",
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

    const uploadedFiles = await UploadedFile.find({
      conversation: conversationId,
      user: req.user,
    })
      .select("+fileData")
      .sort({
        createdAt: 1,
      });
    const userMessage = await Message.create({
      conversation: conversationId,
      user: req.user,
      role: "user",
      content: content.trim(),
    });

    if (
      !conversation.title ||
      conversation.title === "New AI Chat" ||
      conversation.title === "New conversation"
    ) {
      conversation.title = createDisplayTitle(content);
    }

    const previousMessages = await Message.find({
      conversation: conversationId,
      user: req.user,
    })
      .sort({ createdAt: 1 })
      .limit(20);

    const fileContext = createFileContext(uploadedFiles);
    const imageFiles = uploadedFiles.filter((file) =>
      file.mimeType?.startsWith("image/"),
    );

    const hasImages = imageFiles.length > 0;
    const messages = [];

    if (fileContext) {
      messages.push({
        role: "system",
        content: `
You are an AI assistant inside an AI Messenger application.

The user may upload files to a conversation.

You have access to the extracted content of the uploaded files below.

Follow these rules:

1. Read and understand the uploaded file content.
2. Use the uploaded file content when answering questions about the file.
3. Do not claim that you cannot access the uploaded file.
4. If the user asks something unrelated to the uploaded file, answer normally.
5. If the answer is not available in the uploaded file, clearly say that it was not found in the uploaded file.
6. Do not invent information that is not present in the uploaded file.
7. For code files, understand the code and explain it when asked.
8. For JSON files, understand the structure and values.
9. For PDF, DOCX and TXT files, use the extracted text as the source.
10. If multiple files are uploaded, use the relevant file or files when answering.

${fileContext}
`,
      });
    }

    previousMessages.forEach((message, index) => {
      const isLastUserMessage =
        message.role === "user" && index === previousMessages.length - 1;

      if (isLastUserMessage && hasImages) {
        const content = [
          {
            type: "text",
            text: message.content,
          },
        ];

        imageFiles.slice(0, 5).forEach((file) => {
          const imageDataUrl = createImageDataUrl(file);

          if (imageDataUrl) {
            content.push({
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            });
          }
        });

        messages.push({
          role: "user",
          content,
        });
      } else {
        messages.push({
          role: message.role,
          content: message.content,
        });
      }
    });

    const completion = hasImages
      ? await generateVisionWithFallback(messages, 0.7)
      : await generateWithFallback(messages, 0.7);

    const aiContent = completion.choices[0].message.content;

    const aiMessage = await Message.create({
      conversation: conversationId,
      user: req.user,
      role: "assistant",
      content: aiContent,
    });

    conversation.updatedAt = new Date();

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "AI response generated successfully!",
      userMessage,
      aiMessage,
    });
  } catch (error) {
    console.error("AI Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
    });
  }
};

const regenerateAIResponse = async (req, res) => {
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

    const uploadedFiles = await UploadedFile.find({
      conversation: conversationId,
      user: req.user,
    }).sort({
      createdAt: 1,
    });

    const previousMessages = await Message.find({
      conversation: conversationId,
      user: req.user,
    })
      .sort({ createdAt: 1 })
      .limit(20);

    let lastUserMessage = null;

    for (let i = previousMessages.length - 1; i >= 0; i--) {
      if (previousMessages[i].role === "user") {
        lastUserMessage = previousMessages[i];
        break;
      }
    }

    if (!lastUserMessage) {
      return res.status(400).json({
        success: false,
        message: "No user message found to regenerate",
      });
    }

    const fileContext = createFileContext(uploadedFiles);

    const messagesForAI = [];

    if (fileContext) {
      messagesForAI.push({
        role: "system",
        content: `
You are an AI assistant inside an AI Messenger application.

The user has uploaded files to this conversation.

Use the uploaded file content when answering questions about those files.

Rules:

1. Read and understand the uploaded file content.
2. Use the file content when answering questions about it.
3. Do not claim that you cannot access the file.
4. For code files, understand and explain the code.
5. For JSON files, understand the structure and values.
6. For PDF, DOCX and TXT files, use the extracted text.
7. Do not invent information that is not present in the uploaded file.
8. If the requested information is not found in the file, clearly say so.

${fileContext}
`,
      });
    }

    for (const message of previousMessages) {
      messagesForAI.push({
        role: message.role,
        content: message.content,
      });

      if (message._id.toString() === lastUserMessage._id.toString()) {
        break;
      }
    }

    const completion = await generateWithFallback(messagesForAI, 0.9);

    const aiContent = completion.choices[0].message.content;

    const aiMessage = await Message.create({
      conversation: conversationId,
      user: req.user,
      role: "assistant",
      content: aiContent,
    });

    conversation.updatedAt = new Date();

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "AI response regenerated successfully!",
      aiMessage,
    });
  } catch (error) {
    console.error("Regenerate AI Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to regenerate AI response",
    });
  }
};

module.exports = {
  generateAIResponse,
  regenerateAIResponse,
};
