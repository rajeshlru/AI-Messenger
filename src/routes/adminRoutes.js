const express = require("express");
const router = express.Router();
const {
  verifyAdmin,
  getAllPasswords,
  deletePassword,
} = require("../controllers/adminController");

router.post("/verify", verifyAdmin);

router.get("/passwords", getAllPasswords);

router.delete("/password/:id", deletePassword);

module.exports = router;
