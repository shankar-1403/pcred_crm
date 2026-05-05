import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = JSON.parse(
    fs.readFileSync(new URL("./serviceAccountKey.json", import.meta.url), "utf-8")
  );
}

const PORT = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://crm-lead-b18f5-default-rtdb.asia-southeast1.firebaseio.com"
});

app.get("/leads", async (req, res) => {
  try {
    const db = admin.database();

    const [leadsSnap, usersSnap,statusSnap,productsSnap, ambSnap, eliteSnap] = await Promise.all([
      db.ref("leads").once("value"),
      db.ref("users").once("value"),
      db.ref("statuses").once("value"),
      db.ref("products").once("value"),
      db.ref("ambassador").once("value"),
      db.ref("elite_ambassador").once("value"),
    ]);

    const leads = leadsSnap.val() || {};
    const users = usersSnap.val() || {};
    const status = statusSnap.val() || {};
    const products = productsSnap.val() || {};
    const ambassador = ambSnap.val() || {};
    const elite = eliteSnap.val() || {};

    const nameMap = {};
    const productMap = {};
    const statusMap = {};

    Object.keys(users).forEach(uid => {
      nameMap[uid] = users[uid].name || "";
    });

    Object.keys(status).forEach(id => {
      statusMap[id] = status[id].name || "";
    });

    Object.keys(products).forEach(id => {
      productMap[id] = products[id].name || "";
    });

    Object.keys(ambassador).forEach(id => {
      nameMap[id] = ambassador[id].name || "";
    });

    Object.keys(elite).forEach(id => {
      nameMap[id] = elite[id].name || "";
    });

    // 🔄 Transform leads
    const result = [];

    Object.keys(leads).forEach(key => {
      const row = leads[key];

      result.push({
        ambassador: row.ambassadorName || "",
        eliteAmbassador: row.eliteAmbassadorName || "",
        connectorName: row.viaName || "",
        clientName: row.clientName || "",
        company: row.company || "",
        status: statusMap[row.status] || row.status || "",
        product: productMap[row.productId] || row.productId || "",
        bankName: row.bankName || "",
        salesOwner: nameMap[row.createdBy] || row.createdBy || "",
        processedBy: nameMap[row.assignedTo] || row.assignedTo || "",
        amount: row.totalAmount || "",
        bankPayoutAmount:row.bankPayoutAmount || '',
        mandateSigned:row.mandateSigned || '',
        mandatePayoutAmount:row.mandatePayoutAmount || '',
        leadDate: row.leadDate || "",
        updatedStatusDate: row.updatedStatusDate || '',
        location:row.location || '',
        description: row.description || '',
      });
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});