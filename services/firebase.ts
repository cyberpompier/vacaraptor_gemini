import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence, 
  GoogleAuthProvider, 
  signInWithRedirect,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKpukYaA1Vq5eh8xauFgWuzj3BCLTcmWM",
  authDomain: "bdd-vacaraptor.firebaseapp.com",
  projectId: "bdd-vacaraptor",
  storageBucket: "bdd-vacaraptor.firebasestorage.app",
  messagingSenderId: "534367493613",
  appId: "1:534367493613:web:68ba373829a50d97445be4",
  measurementId: "G-CS7H26SJTT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Set auth persistence to 'session' to prevent errors in restricted
// environments (like sandboxed iframes) where web storage might be disabled.
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error("Firebase persistence error:", error.code, error.message);
  });

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

export const signUpWithEmail = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithEmail = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};