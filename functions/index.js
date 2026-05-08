import { initializeApp } from "firebase-admin/app";
import { onRequest, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

initializeApp()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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