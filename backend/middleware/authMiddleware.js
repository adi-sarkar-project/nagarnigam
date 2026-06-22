const jwt = require("jsonwebtoken");
const { findAccountById } = require("../utils/accountLookup");

async function protect(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401);
    next(new Error("Authentication token is missing"));
    return;
  }

  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.role || !decoded.id) {
      res.status(401);
      next(new Error("Invalid authentication token"));
      return;
    }

    const account = await findAccountById(decoded.id, decoded.role);

    if (!account) {
      res.status(401);
      next(new Error("User not found"));
      return;
    }

    account.role = decoded.role;
    req.user = account;
    next();
  } catch (_error) {
    res.status(401);
    next(new Error("Invalid or expired token"));
  }
}

function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    res.status(403);
    next(new Error("Only admins can access this resource"));
    return;
  }
  next();
}

function authorizeStaff(req, res, next) {
  if (req.user.role !== "staff") {
    res.status(403);
    next(new Error("Only staff can access this resource"));
    return;
  }
  next();
}

module.exports = {
  protect,
  authorizeAdmin,
  authorizeStaff,
};
