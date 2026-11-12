import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYrk0pA2n36c-fk9NvpwJYw2mcTBYsAnc",
  authDomain: "maxima-6f4dc.firebaseapp.com",
  projectId: "maxima-6f4dc",
  storageBucket: "maxima-6f4dc.firebasestorage.app",
  messagingSenderId: "294387008300",
  appId: "1:294387008300:web:6b276d0689742576432289",
  measurementId: "G-D6W9MKN7PD",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
