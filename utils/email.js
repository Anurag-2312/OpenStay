const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports.sendPasswordResetEmail = async (toEmail, resetUrl) => {
  await transporter.sendMail({
    from: `"OpenStay" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your OpenStay password",
    html: `
      <div style="font-family:Plus Jakarta Sans,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#fe424d;">OpenStay</h2>
        <p>You asked to reset your password. Click the button below to set a new one. The link expires in 1 hour.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#fe424d;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;">Reset password</a>
        </p>
        <p style="font-size:0.85em;color:#888;">If the button doesn't work, paste this link into your browser:<br>${resetUrl}</p>
        <p style="font-size:0.85em;color:#888;">Didn't ask for a reset? Ignore this email.</p>
      </div>
    `,
  });
};
