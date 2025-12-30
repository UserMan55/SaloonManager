
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function checkIlhami() {
    console.log("Checking for 'İlhami İLHAN'...");
    const usersRef = collection(db, 'users');

    // Check by Name
    const q1 = query(usersRef, where('name', '==', 'İlhami İLHAN'));
    const s1 = await getDocs(q1);

    // Check by FullName
    const q2 = query(usersRef, where('fullName', '==', 'İlhami İLHAN'));
    const s2 = await getDocs(q2);

    console.log(`Found ${s1.size} docs by 'name'.`);
    s1.forEach(d => console.log(d.id, d.data()));

    console.log(`Found ${s2.size} docs by 'fullName'.`);
    s2.forEach(d => console.log(d.id, d.data()));
}

checkIlhami().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
