import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC-7I2cMkE_zWaHs3E3TY-E_x8FNAP04rQ",
  authDomain: "daily-puzzle-game-850da.firebaseapp.com",
  projectId: "daily-puzzle-game-850da",
  storageBucket: "daily-puzzle-game-850da.firebasestorage.app",
  messagingSenderId: "255868273190",
  appId: "1:255868273190:web:2e2dbb9553c1d88c825ce7",
  measurementId: "G-R0B2F4PV37"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
