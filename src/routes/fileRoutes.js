const express = require("express");

const { upload, uploadFile } = require("../controllers/fileController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/:conversationId",
  authMiddleware,
  upload.single("file"),
  uploadFile,
);

module.exports = router;
