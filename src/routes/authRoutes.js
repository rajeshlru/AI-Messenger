const express = require("express");

const {
  registerUser,
  loginUser,
  deleteAccount,
  changePassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/change-password", authMiddleware, changePassword);

router.delete("/delete-account", authMiddleware, deleteAccount);

module.exports = router;
