import { initializeApp } from "firebase-admin/app";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

initializeApp()

export const updateUserByAdmin = onCall(async (request) => {
  try {
    const { uid, email, password, displayName } = request.data;

    const updateData = {};

    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (displayName) updateData.displayName = displayName;

    await getAuth().updateUser(uid, updateData);

    return {
      success: true,
    };
  } catch (err) {
    console.error(err);

    throw new HttpsError(
      "internal",
      err.message || "Failed to update user"
    );
  }
});

export const deleteUserByAdmin = onCall(async (request) => {
  try {
    const { uid } = request.data;

    await getAuth().deleteUser(uid);

    return {
      success: true,
    };
  } catch (err) {
    console.error(err);

    throw new HttpsError(
      "internal",
      err.message || "Failed to delete user"
    );
  }
});