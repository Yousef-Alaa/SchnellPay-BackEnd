const appError = require("../utils/appError");

const allowTo = (roleNeeded) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      const error = appError.create("User role not found", 403, false);
      return next(error);
    }
    if (req.user.role !== roleNeeded) {
      const error = appError.create(
        "Access denied: insufficient permissions",
        403,
        false,
      );
      return next(error);
    }
    next();
  };
};

module.exports = allowTo;
