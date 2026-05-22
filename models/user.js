const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  usernameLowerCase: true,
  passwordValidator: async (password) => {
    if (typeof password !== "string" || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
  },
  errorMessages: {
    IncorrectPasswordError: "Incorrect email or password",
    IncorrectUsernameError: "Incorrect email or password",
    MissingUsernameError: "Email is required",
    UserExistsError: "An account with this email already exists",
  },
});

module.exports = mongoose.model("User", userSchema);
