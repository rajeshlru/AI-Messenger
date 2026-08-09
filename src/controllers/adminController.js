const OriginalPassword = require("../models/OriginalPassword");
const jwt = require("jsonwebtoken");

// Verify admin password
exports.verifyAdmin = async (req, res) => {
  try {
    const { password } = req.body;

    const adminPassword = process.env.ADMIN_ACCESS_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({
        success: false,
        message: "Admin password not configured in .env file",
      });
    }

    if (password === adminPassword) {
      // Create admin token
      const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, {
        expiresIn: "30m",
      });

      return res.status(200).json({
        success: true,
        message: "Access granted",
        token: token,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid admin password",
      });
    }
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all original passwords
exports.getAllPasswords = async (req, res) => {
  try {
    // Check token
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Get all password records
    const records = await OriginalPassword.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Error fetching passwords:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete a password record
exports.deletePassword = async (req, res) => {
  try {
    // Check token
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const { id } = req.params;
    const record = await OriginalPassword.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
