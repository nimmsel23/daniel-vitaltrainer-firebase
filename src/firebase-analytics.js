import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBt6AtKfE1aGWCaOeTxT6U4rL8cVmA65oQ",
  authDomain: "daniel-vitaltrainer.firebaseapp.com",
  projectId: "daniel-vitaltrainer",
  storageBucket: "daniel-vitaltrainer.firebasestorage.app",
  messagingSenderId: "401699753635",
  appId: "1:401699753635:web:fbd80de9339d526ca27916",
  measurementId: "G-WF4MC0VMV8"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
