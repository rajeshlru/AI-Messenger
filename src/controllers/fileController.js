const multer = require("multer");
const pdfParse = require("pdf-parse");

const UploadedFile = require("../models/UploadedFile");
const Conversation = require("../models/Conversation");

const allowedExtensions = [
  /* PDF */
  ".pdf",

  /* TEXT */
  ".txt",

  /* JSON */
  ".json",

  /* CODE */
  ".java",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".c",
  ".cpp",
  ".h",
  ".html",
  ".css",
  ".sql",

  /* IMAGES */
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
];

const allowedMimeTypes = [
  /* PDF */
  "application/pdf",

  /* TEXT */
  "text/plain",

  /* JSON */
  "application/json",
  "text/json",

  /* CODE */
  "text/javascript",
  "application/javascript",
  "text/html",
  "text/css",
  "application/sql",

  /* IMAGES */
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    try {
      if (!file.originalname) {
        return cb(null, false);
      }

      if (file.originalname.length > 150) {
        return cb(null, false);
      }

      const fileName = file.originalname.toLowerCase();

      const extension = fileName.substring(fileName.lastIndexOf("."));

      const extensionAllowed = allowedExtensions.includes(extension);

      const mimeAllowed = allowedMimeTypes.includes(file.mimetype);

      if (!extensionAllowed || !mimeAllowed) {
        return cb(null, false);
      }

      cb(null, true);
    } catch (error) {
      console.error("File Validation Error:", error);

      cb(null, false);
    }
  },
});

const extractText = async (file) => {
  const fileName = file.originalname.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    const result = await pdfParse(file.buffer);

    return result.text;
  }

  if (
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".gif") ||
    fileName.endsWith(".webp")
  ) {
    return "Image file uploaded successfully.";
  }

  return file.buffer.toString("utf-8");
};

const uploadFile = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file. Allowed files: PDF, TXT, JSON, code files and images (PNG, JPG, JPEG, GIF, WEBP). Maximum size is 5 MB.",
      });
    }

    if (!req.file.originalname || req.file.originalname.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Invalid file name.",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    const extractedText = await extractText(req.file);

    const isImage = req.file.mimetype.startsWith("image/");

    if (!isImage && (!extractedText || !extractedText.trim())) {
      return res.status(400).json({
        success: false,
        message: "Could not extract readable text from this file.",
      });
    }

    const uploadedFile = await UploadedFile.create({
      conversation: conversationId,
      user: req.user,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      extractedText: extractedText.trim(),
    });

    conversation.updatedAt = new Date();

    await conversation.save();

    res.status(201).json({
      success: true,
      message: "File uploaded successfully.",
      file: {
        _id: uploadedFile._id,
        originalName: uploadedFile.originalName,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
        createdAt: uploadedFile.createdAt,
      },
    });
  } catch (error) {
    console.error("File Upload Error:", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size must not exceed 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "File upload validation failed.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file.",
    });
  }
};

module.exports = {
  upload,
  uploadFile,
};
