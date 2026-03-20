import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC02fw1H2qrhjv6SoktSk8Ns9dQVZyEc_U",
  authDomain: "qlds-v3.firebaseapp.com",
  projectId: "qlds-v3",
  storageBucket: "qlds-v3.firebasestorage.app",
  messagingSenderId: "484174154191",
  appId: "1:484174154191:web:e7d77725f64a66faf22aba",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
