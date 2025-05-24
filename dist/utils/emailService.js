"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
require('dotenv').config();
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const resend = new resend_1.Resend(process.env.EMAIL_PASSWORD);
    const { data, error } = yield resend.emails.send({
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
});
exports.default = sendEmail;
