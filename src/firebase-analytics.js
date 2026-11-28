import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBt6AtKfE1aGWCaOeTxT6U4rL8cVmA65oQ",
  authDomain: "daniel-vitaltrainer.firebaseapp.com",
  projectId: "daniel-vitaltrainer",
  storageBucket: "daniel-vitaltrainer.firebasestorage.app",
  messagingSenderId: "401699753635",
  appId: "1:401699753635:web:fbd80de9339d526ca27916",
  measurementId: "G-WF4MC0VMV8"
};

// Nur echte Live-Domains messen; lokale Tests und Vorschau-Hosts verfälschen sonst die Zahlen.
const LIVE_HOSTS = ["daniel-vitaltrainer.web.app", "daniel-vitaltrainer.firebaseapp.com", "vitalos.at", "www.vitalos.at"];

if (LIVE_HOSTS.includes(location.hostname)) {
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const queued = window.vtTrackQueue || [];
  window.vtTrack = (name, params = {}) => logEvent(analytics, name, { page_path: location.pathname, ...params });
  queued.forEach(([name, params]) => window.vtTrack(name, params));
  window.vtTrackQueue = [];
}
