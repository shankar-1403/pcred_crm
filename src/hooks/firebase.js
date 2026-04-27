import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB83FW96OlZJj73Zhe6z3jwEQn1bqJ0HeY",
  authDomain: "crm-lead-b18f5.firebaseapp.com",
  projectId: "crm-lead-b18f5",
  storageBucket: "crm-lead-b18f5.firebasestorage.app",
  messagingSenderId: "123676561897",
  appId: "1:123676561897:web:1a2797a74ff3480fe3bb78"
};

// 🔥 Prevent duplicate initialization
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export services
export const storage = getStorage(app);
export const db = getDatabase(app);