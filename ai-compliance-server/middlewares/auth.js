import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        error: "Access Denied. No token provided.",
        code: "NO_TOKEN"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded._id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: "User not found.",
        code: "USER_NOT_FOUND"
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: "Account is deactivated.",
        code: "ACCOUNT_DEACTIVATED"
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Token expired.",
        code: "TOKEN_EXPIRED"
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: "Invalid token.",
        code: "INVALID_TOKEN"
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: "Authentication failed.",
      code: "AUTH_ERROR"
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: "Authentication required.",
        code: "AUTH_REQUIRED"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}`,
        code: "INSUFFICIENT_PERMISSIONS"
      });
    }

    next();
  };
};

// Lawyer-specific authorization
export const authorizeLawyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required.",
      code: "AUTH_REQUIRED"
    });
  }

  if (req.user.role !== 'lawyer' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: "Lawyer access required.",
      code: "LAWYER_ACCESS_REQUIRED"
    });
  }

  next();
};

// Admin-only authorization
export const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: "Authentication required.",
      code: "AUTH_REQUIRED"
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: "Admin access required.",
      code: "ADMIN_ACCESS_REQUIRED"
    });
  }

  next();
};
