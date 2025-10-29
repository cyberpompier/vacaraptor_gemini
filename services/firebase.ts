// FIX: Switched to Firebase v9 compat imports to resolve module loading error.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

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
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();

// FIX: Set auth persistence to 'session' to prevent errors in restricted
// environments (like sandboxed iframes) where web storage might be disabled.
// This uses session storage instead of IndexedDB (the default).
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
  .catch((error) => {
    console.error("Firebase persistence error:", error.code, error.message);
  });

const googleProvider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = () => {
  return auth.signInWithPopup(googleProvider);
};

// FIX: Added types for email and password parameters.
export const signUpWithEmail = (email: string, password: string) => {
    return auth.createUserWithEmailAndPassword(email, password);
};

// FIX: Added types for email and password parameters.
export const signInWithEmail = (email: string, password: string) => {
    return auth.signInWithEmailAndPassword(email, password);
};