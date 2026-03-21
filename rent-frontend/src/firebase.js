import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCzwYMtakvoaSkrpdZsqKFCEHKqaoAlkQo",
  authDomain: "nomadnest-saas.firebaseapp.com",
  projectId: "nomadnest-saas",
  storageBucket: "nomadnest-saas.firebasestorage.app",
  messagingSenderId: "730903392302",
  appId: "1:730903392302:web:e8477a99bf6eb9b57fefbf",
  measurementId: "G-VDTLJEPT6V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// FORCE the browser to write the login to local storage immediately
setPersistence(auth, browserLocalPersistence);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  // RETURN the result directly so React can use it instantly
  const result = await signInWithPopup(auth, provider);
  return result; 
};

export const logout = () => signOut(auth);