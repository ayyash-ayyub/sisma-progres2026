import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvG0owbw9OL0AZwsmnDRkJevp7b3jT5cc",
  authDomain: "sisma-tracer.firebaseapp.com",
  projectId: "sisma-tracer",
  storageBucket: "sisma-tracer.firebasestorage.app",
  messagingSenderId: "780175989258",
  appId: "1:780175989258:web:32eb7e84895bbdb882ddf3",
  measurementId: "G-NRS0LLP4CH"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
