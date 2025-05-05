import { Resend } from "resend";
import { EmailOptions } from "../types";
require('dotenv').config();

const sendEmail = async (options: EmailOptions) => {

  const resend = new Resend(process.env.EMAIL_PASSWORD);

  const {data, error} = await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@foodapp.com",
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.text || "",
  });

  if (error) {
    console.error("Error sending email:", error);
    throw new Error("Email sending failed");
  }
  console.log("Email sent successfully:", data);
};

export default sendEmail;