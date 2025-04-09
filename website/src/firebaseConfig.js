// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBFtZRvJa6Y2-aZDE7O-vHUMurwCB9TJcY",
  authDomain: "versatile-skein-420505.firebaseapp.com",
  projectId: "versatile-skein-420505",
  storageBucket: "versatile-skein-420505.appspot.com",
  messagingSenderId: "835513582400",
  appId: "1:835513582400:web:a20272491172e0ac7ef0a5",
  measurementId: "G-0ZSBWHBH86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { auth };