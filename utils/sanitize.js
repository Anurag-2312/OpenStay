function sanitize(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  const clean = {};
  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    clean[key] = sanitize(value[key]);
  }
  return clean;
}

module.exports = function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitize(req.body);
  }
  next();
};
