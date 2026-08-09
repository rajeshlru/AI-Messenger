const express = require("express");

const {
  registerUser,
  loginUser,
  deleteAccount,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.delete("/delete-account", authMiddleware, deleteAccount);

module.exports = router;


