import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCgglN1qjA_XzTy9A8SqNIVr-RFk8mmuPg",
  authDomain: "nskranked.firebaseapp.com",
  projectId: "nskranked",
  storageBucket: "nskranked.firebasestorage.app",
  messagingSenderId: "265020435431",
  appId: "1:265020435431:web:9ecb7d98a49fc4ada9eb42",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);