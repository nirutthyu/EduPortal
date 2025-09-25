// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth,signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDo4zwhRMBOIOfYQzCSzGkDvUYmYtu7574",
  authDomain: "eduportal-c14c7.firebaseapp.com",
  projectId: "eduportal-c14c7",
  storageBucket: "eduportal-c14c7.firebasestorage.app",
  messagingSenderId: "22838625062",
  appId: "1:22838625062:web:464edb34160c1e6360b7e7",
  measurementId: "G-V1WSQXRXBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export { auth,signOut ,createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, googleProvider };






