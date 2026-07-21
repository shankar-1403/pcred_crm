import { initializeApp } from "firebase-admin/app";
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";

initializeApp()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}


const M365_EMAIL = defineSecret("M365_EMAIL");
const M365_PASSWORD = defineSecret("M365_PASSWORD");

export const sendMail = onRequest(
  {
    secrets: [M365_EMAIL, M365_PASSWORD],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.set(corsHeaders);
      res.status(204).send("");
      return;
    }

    res.set(corsHeaders);

    // Create transporter inside the function
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: M365_EMAIL.value(),
        pass: M365_PASSWORD.value(),
      },
    });

    try {
      const {
        email,
        name,
        company,
        clientEmail,
        clientPhoneNo,
        product,
        category,
        service,
        amount,
      } = req.body;

      await transporter.sendMail({
        from: `"PCRED" <${M365_EMAIL.value()}>`,
        to: email,
        subject: "New Lead Via ECB MSME Link",
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Company Name:</strong> ${company}</p>
          <p><strong>Email:</strong> ${clientEmail}</p>
          <p><strong>Phone:</strong> ${clientPhoneNo}</p>
          ${product ? `<p><strong>Product:</strong> ${product}</p>` : ""}
          ${category ? `<p><strong>Category:</strong> ${category}</p>` : ""}
          ${service ? `<p><strong>Service:</strong> ${service}</p>` : ""}
          ${amount ? `<p><strong>Amount:</strong> ${amount}</p>` : ""}
        `,
      });

      res.status(200).json({
        success: true,
        message: "Mail Sent",
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error: err.message || "Failed to send mail",
      });
    }
  }
);

export const shareMarketingMail = onRequest(
  {
    cors: true,
    secrets: [M365_EMAIL, M365_PASSWORD],
  },
  async (req, res) => {
    res.set(corsHeaders);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Create transporter here so secrets are available
    const transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: M365_EMAIL.value(),
        pass: M365_PASSWORD.value(),
      },
    });

    try {
      const {
        to,
        cc,
        subject,
        content,
        attachmentUrl,
        attachmentName,
      } = req.body || {};

      const toEmail = String(to ?? "").trim();
      if (!toEmail || !toEmail.includes("@")) {
        res.status(400).json({ error: "Valid 'to' email is required." });
        return;
      }

      const ccEmail = String(cc ?? "").trim();
      if (!ccEmail || !ccEmail.includes("@")) {
        res.status(400).json({ error: "Valid 'cc' email is required." });
        return;
      }


      const mailSubject =
        String(subject ?? "").trim() ||
        "PCRED - Your One-Stop Corporate Advisory Partner";

      const mailContent = String(content ?? "").trim();
      if (!mailContent) {
        res.status(400).json({ error: "Email content is required." });
        return;
      }

      const fileUrl = String(attachmentUrl ?? "").trim();
      const fileName =
        String(attachmentName ?? "").trim() ||
        (fileUrl ? fileUrl.split("/").pop()?.split("?")[0] : "") ||
        "attachment.pdf";

      const htmlBody = mailContent
        .split("\n")
        .map(
          (line) =>
            `<p style="margin:0 0 8px 0;">${escapeHtml(line) || "&nbsp;"}</p>`
        )
        .join("");

      const mailOptions = {
        from: `"PCRED" <${M365_EMAIL.value()}>`,
        to: toEmail,
        cc: ccEmail,
        subject: mailSubject,
        text: mailContent,
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
            ${htmlBody}
          </div>
        `,
      };

      if (fileUrl) {
        mailOptions.attachments = [
          {
            filename: decodeURIComponent(fileName),
            path: fileUrl,
          },
        ];
      }

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: "Mail Sent",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: err?.message || "Failed to send mail",
      });
    }
  }
);

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const updateUserByAdmin = onRequest(async (req,res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders)
    res.status(204).send('')
    return
  }
  try {
    res.set(corsHeaders)
    const { uid, email, password, displayName } = req.body;

    const updateData = {};

    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (displayName) updateData.displayName = displayName;

    await getAuth().updateUser(uid, updateData);

    res.status(200).json({
      success: true,
    })
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: error.message,
    })
  }
});

export const deleteUserByAdmin = onRequest(async (req,res) => {
  if (req.method === 'OPTIONS') {
    res.set(corsHeaders)
    res.status(204).send('')
    return
  }
  try {
    res.set(corsHeaders)
    const { uid } = req.body;

    await getAuth().deleteUser(uid);

    res.status(200).json({
      success: true,
    })
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: error.message,
    })
  }
});