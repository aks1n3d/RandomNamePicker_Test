// src/firebase.js

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// <-- Подставьте свои данные из Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCPEIQAwJMu_u2q_dlE8rtue52MMeDjN0g",
    authDomain: "aks1n3d-rand-test.firebaseapp.com",
    databaseURL: "https://aks1n3d-rand-test-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "aks1n3d-rand-test",
    storageBucket: "aks1n3d-rand-test.firebasestorage.app",
    messagingSenderId: "645602650565",
    appId: "1:645602650565:web:a9a850c7ac1ef3b06ec3ac",
    measurementId: "G-CK8ZJMSZMP"
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Экспортируем db, чтобы использовать в App.js
export { db };