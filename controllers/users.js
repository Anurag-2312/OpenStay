const crypto = require("crypto");
const User = require("../models/user.js");
const { sendPasswordResetEmail } = require("../utils/email.js");

function safeRedirectUrl(url) {
  if (typeof url !== "string") return null;
  if (!url.startsWith("/")) return null;
  if (url.startsWith("//")) return null;
  return url;
}

module.exports.renderSignupForm = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const email =
      typeof req.body.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "";
    if (!username || !email || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/signup");
    }
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to OpenStay!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back!");
  const candidate = safeRedirectUrl(res.locals.redirectUrl);
  delete req.session.redirectUrl;
  res.redirect(candidate || "/listings");
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You are logged out");
    res.redirect("/listings");
  });
};

module.exports.renderForgotForm = (req, res) => {
  res.render("users/forgot.ejs");
};

module.exports.sendForgotEmail = async (req, res) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.toLowerCase().trim()
      : "";
  if (email) {
    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
      await user.save();
      const resetUrl = `${req.protocol}://${req.get("host")}/reset/${token}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (e) {
        console.log("Email send failed:", e.message);
      }
    }
  }
  req.flash(
    "success",
    "If that email is registered, a reset link has been sent.",
  );
  res.redirect("/login");
};

module.exports.renderResetForm = async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Reset link is invalid or has expired");
    return res.redirect("/forgot");
  }
  res.render("users/reset.ejs", { token });
};

module.exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  if (typeof password !== "string" || password.length < 8) {
    req.flash("error", "Password must be at least 8 characters");
    return res.redirect(`/reset/${token}`);
  }
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Reset link is invalid or has expired");
    return res.redirect("/forgot");
  }
  try {
    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  } catch (e) {
    req.flash("error", e.message || "Could not update password");
    return res.redirect(`/reset/${token}`);
  }
  req.login(user, (err) => {
    if (err) return next(err);
    req.flash("success", "Password updated. You are now logged in.");
    res.redirect("/listings");
  });
};
