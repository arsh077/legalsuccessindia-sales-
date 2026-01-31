
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9cESjKHrs3hS49jOyjluhW-7V-TSZNao",
  authDomain: "leads-f79ec.firebaseapp.com",
  projectId: "leads-f79ec",
  storageBucket: "leads-f79ec.firebasestorage.app",
  messagingSenderId: "812097501812",
  appId: "1:812097501812:web:e898de74170af56dd9ef21",
  measurementId: "G-YZL43WDYVS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
