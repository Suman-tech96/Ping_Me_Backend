import nodemailer from "nodemailer";

export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP for Password Reset",
      html: `<h3>Your OTP is: ${otp}</h3>`
    });

  } catch (err) {
    console.log(err.message);
    throw new Error("Email send failed");
  }
};

export const sendNotificationEmail = async (email, senderName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "New Connection Attempt - Chat App",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Hello,</h2>
          <p><strong>${senderName}</strong> is trying to connect with you on the Chat App.</p>
          <p>Since you are currently offline, we wanted to let you know.</p>
          <p>Log in now to join the conversation!</p>
          <br>
          <p>Best regards,<br>Chat App Team</p>
        </div>
      `
    });

  } catch (err) {
    console.log("Notification email failed:", err.message);
  }
};