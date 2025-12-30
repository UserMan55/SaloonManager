
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (Avoid re-init issues in script, though strictly one-shot here)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function updateIlhami() {
    console.log("Searching for 'İlhami İLHAN'...");

    // 1. Update in 'users' (Global Pool)
    const usersRef = collection(db, 'users');
    const qUser = query(usersRef, where('name', '==', 'İlhami İLHAN')); // Try 'name' first
    const qUserFull = query(usersRef, where('fullName', '==', 'İlhami İLHAN')); // Try 'fullName'

    const snaps = [await getDocs(qUser), await getDocs(qUserFull)];
    let foundUser = false;

    for (const snap of snaps) {
        for (const userDoc of snap.docs) {
            foundUser = true;
            console.log(`Found User ID: ${userDoc.id}, Current Data:`, userDoc.data());
            await updateDoc(doc(db, 'users', userDoc.id), { city: 'SAMSUN' });
            console.log(`Updated User ${userDoc.id} city to SAMSUN.`);
        }
    }

    if (!foundUser) console.log("No matching document found in 'users' collection.");

    // 2. Update in 'players' (Salon Specific)
    const playersRef = collection(db, 'players');
    const qPlayer = query(playersRef, where('fullName', '==', 'İlhami İLHAN'));
    const playerSnap = await getDocs(qPlayer);

    if (playerSnap.empty) {
        console.log("No matching document found in 'players' collection.");
    } else {
        for (const playerDoc of playerSnap.docs) {
            console.log(`Found Player ID: ${playerDoc.id}, Current Data:`, playerDoc.data());
            await updateDoc(doc(db, 'players', playerDoc.id), { city: 'SAMSUN' });
            console.log(`Updated Player ${playerDoc.id} city to SAMSUN.`);
        }
    }
}

updateIlhami().then(() => {
    console.log("Done.");
    process.exit(0);
}).catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
