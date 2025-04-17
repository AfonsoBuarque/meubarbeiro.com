import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyACZPubimPLAFWm5vebMJdgRtxmnY5ThOk",
  authDomain: "fft-solucoes.firebaseapp.com",
  projectId: "fft-solucoes",
  storageBucket: "fft-solucoes.firebasestorage.app",
  messagingSenderId: "478444990886",
  appId: "1:478444990886:web:b2ca7a023dc5a834dcdf67",
  measurementId: "G-6RXVTD8F5R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);