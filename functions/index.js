import { initializeApp } from "firebase-admin/app";
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";

initializeApp()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "pcred.advisory@gmail.com",
        pass: "ihkj swsw lwsv flne",
    },
});

export const sendMail = onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(corsHeaders);
    res.status(204).send("");
    return;
  }
    try {
      res.set(corsHeaders)
      const { email,name,company,clientEmail,clientPhoneNo,product,category,service,amount } = req.body;
        await transporter.sendMail({
            from: "PCRED <pcred.advisory@gmail.com>",
            to: email,
            subject: "New Lead Via ECB MSME Link",
            html: `
              <p>Name: ${name}</p>
              <p>Company Name: ${company}</p>
              <p>Email: ${clientEmail}</p>
              <p>Phone: ${clientPhoneNo}</p>
              ${product ? `<p>Product: ${product}</p>` : ""}
              ${category ? `<p>Category: ${category}</p>` : ""}
              ${service ? `<p>Service: ${service}</p>` : ""}
              ${amount ? `<p>Amount: ${amount}</p>` : ""}
            `,
        });

        res.status(200).send("Mail Sent");
    } catch (err) {
        console.log(err);
        res.status(500).json({
          error: err.message,
        });
    }
});

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