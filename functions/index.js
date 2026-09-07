import { initializeApp } from "firebase-admin/app";
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";
import { getDatabase } from "firebase-admin/database";

initializeApp()

const db = getDatabase();

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

export const updateUserByAdmin = onRequest(async (req, res) => {
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

export const deleteUserByAdmin = onRequest(async (req, res) => {
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
      error: err.message,
    })
  }
});

export const pushLeads = onRequest({ cors: true }, async (req, res) => {
  try {
    // =====================================================
    // METHOD CHECK
    // =====================================================

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed",
      });
    }

    const body = req.body;

    // =====================================================
    // FEEDBACK MODE
    // { leadId: "LEAD001", feedback: "Interested" }
    // =====================================================

    if (
      !Array.isArray(body) &&
      body &&
      body.feedback !== undefined
    ) {
      const { leadId, feedback } = body;

      if (!leadId) {
        return res.status(400).json({
          success: false,
          message: "Lead Id is required",
        });
      }

      if (!feedback || String(feedback).trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Feedback is required",
        });
      }

      // Find existing lead
      const snapshot = await db
        .ref("extracted_leads")
        .orderByChild("leadId")
        .equalTo(leadId)
        .once("value");

      if (!snapshot.exists()) {
        return res.status(404).json({
          success: false,
          message: "Lead not found",
        });
      }

      const updates = {};
      const updatedAt = new Date().toISOString();

      snapshot.forEach((child) => {
        updates[`extracted_leads/${child.key}/feedback`] = feedback;
        updates[`extracted_leads/${child.key}/updatedAt`] = updatedAt;
      });

      await db.ref().update(updates);

      return res.status(200).json({
        success: true,
        message: "Feedback submitted successfully",
        leadId,
        feedback,
      });
    }

    // =====================================================
    // NEW LEADS MODE
    // =====================================================

    const leads = Array.isArray(body) ? body : [body];

    if (!leads.length) {
      return res.status(400).json({
        success: false,
        message: "Lead data is required",
      });
    }

    // =====================================================
    // GET EXISTING LEADS ONCE
    // =====================================================

    const existingSnapshot = await db
      .ref("extracted_leads")
      .once("value");

    const existingLeadIds = new Set();

    if (existingSnapshot.exists()) {
      existingSnapshot.forEach((child) => {
        const existingLeadId = child.val()?.leadId;

        if (existingLeadId) {
          existingLeadIds.add(String(existingLeadId));
        }
      });
    }

    // =====================================================
    // PREPARE NEW LEADS
    // =====================================================

    const updates = {};
    const results = [];

    // Keep track of IDs from this request
    const requestLeadIds = new Set();

    for (const lead of leads) {
      const {
        leadId,
        client_name,
        company_name,
        turnover,
        phone,
        personal_email,
        business_email,
        address,
        zip_code,
        cibil,
        cmr,
        others_1,
        others_2,
        others_3,
        others_4,
        others_5,
        others_6,
      } = lead || {};

      // =====================================================
      // VALIDATE LEAD ID
      // =====================================================

      if (!leadId) {
        results.push({
          success: false,
          message: "Lead Id is required",
        });

        continue;
      }

      const normalizedLeadId = String(leadId).trim();

      // =====================================================
      // CHECK DATABASE DUPLICATE
      // =====================================================

      if (existingLeadIds.has(normalizedLeadId)) {
        results.push({
          success: false,
          leadId: normalizedLeadId,
          duplicate: true,
          message: "Lead already exists",
        });

        continue;
      }

      // =====================================================
      // CHECK DUPLICATE IN SAME REQUEST
      // =====================================================

      if (requestLeadIds.has(normalizedLeadId)) {
        results.push({
          success: false,
          leadId: normalizedLeadId,
          duplicate: true,
          message: "Duplicate leadId in request",
        });

        continue;
      }

      requestLeadIds.add(normalizedLeadId);

      // =====================================================
      // GENERATE FIREBASE KEY
      // =====================================================

      const leadKey = db
        .ref("extracted_leads")
        .push()
        .key;

      const now = new Date().toISOString();

      // =====================================================
      // LEAD DATA
      // =====================================================

      const leadData = {
        id: leadKey,
        leadId: normalizedLeadId,

        company_name: company_name ?? "",
        client_name: client_name ?? "",
        turnover: turnover ?? "",
        phone: phone ?? "",

        personal_email: personal_email ?? "",
        business_email: business_email ?? "",

        address: address ?? "",
        zip_code: zip_code ?? "",

        cibil: cibil ?? "",
        cmr: cmr ?? "",

        feedback: "",

        others_1: others_1 ?? "",
        others_2: others_2 ?? "",
        others_3: others_3 ?? "",
        others_4: others_4 ?? "",
        others_5: others_5 ?? "",
        others_6: others_6 ?? "",

        createdAt: now,
        updatedAt: now,
      };

      // Add to bulk update
      updates[`extracted_leads/${leadKey}`] = leadData;

      results.push({
        success: true,
        leadId: normalizedLeadId,
        databaseId: leadKey,
        message: "Lead added successfully",
      });
    }

    // =====================================================
    // SAVE ALL NEW LEADS
    // =====================================================

    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    const added = results.filter(
      (item) => item.success === true
    );

    const duplicates = results.filter(
      (item) => item.duplicate === true
    );

    const failed = results.filter(
      (item) =>
        item.success === false &&
        item.duplicate !== true
    );

    return res.status(200).json({
      success: true,
      message: "Lead processing completed",

      summary: {
        total: leads.length,
        added: added.length,
        duplicates: duplicates.length,
        failed: failed.length,
      },

      results,
    });

  } catch (error) {
    console.error("Push leads error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error?.message || String(error),
    });
  }
});