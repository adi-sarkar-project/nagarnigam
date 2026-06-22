function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      next(new Error("You are not allowed to perform this action"));
      return;
    }

    next();
  };
}

module.exports = authorize;
