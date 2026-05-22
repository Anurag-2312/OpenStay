const express = require("express");
const router = express.Router();
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reset requests. Please try again later." },
});

router
  .route("/signup")
  .get(userController.renderSignupForm)
  .post(authLimiter, wrapAsync(userController.signup));

router
  .route("/login")
  .get(userController.renderLoginForm)
  .post(
    authLimiter,
    saveRedirectUrl,
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    userController.login,
  );

router.post("/logout", userController.logout);

router
  .route("/forgot")
  .get(userController.renderForgotForm)
  .post(forgotLimiter, wrapAsync(userController.sendForgotEmail));

router
  .route("/reset/:token")
  .get(wrapAsync(userController.renderResetForm))
  .post(authLimiter, wrapAsync(userController.resetPassword));

module.exports = router;
