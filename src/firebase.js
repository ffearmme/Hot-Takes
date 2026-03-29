import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAu1IVr_m7e5P2v3VUlQdF2R58PbsFmOe0",
  authDomain: "hot-takes-8a1b1.firebaseapp.com",
  projectId: "hot-takes-8a1b1",
  storageBucket: "hot-takes-8a1b1.firebasestorage.app",
  messagingSenderId: "995519874784",
  appId: "1:995519874784:web:edac896015d53434cd7285",
  measurementId: "G-XJZSPJC774"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth & Firestore for use in the app
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
