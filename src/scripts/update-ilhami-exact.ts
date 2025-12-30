
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
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

async function updateIlhamiExact() {
    console.log("Searching for EXACT match: 'İlhami İLHAN'...");

    // 1. Update in 'users'
    const usersRef = collection(db, 'users');
    // Check both potential field names just in case, but filter strictly in code if needed
    const q1 = query(usersRef, where('fullName', '==', 'İlhami İLHAN'));
    const q2 = query(usersRef, where('name', '==', 'İlhami İLHAN')); // Sometimes imported as 'name'

    const snaps = [await getDocs(q1), await getDocs(q2)];
    let count = 0;

    for (const snap of snaps) {
        for (const userDoc of snap.docs) {
            const data = userDoc.data();
            console.log(`Checking user ${userDoc.id}:`, data);

            // Double check strict equality in JS (though firestore query should handle it)
            if (data.fullName === 'İlhami İLHAN' || data.name === 'İlhami İLHAN') {
                await updateDoc(doc(db, 'users', userDoc.id), { city: 'SAMSUN' });
                console.log(`>>> UPDATED User ${userDoc.id} city to SAMSUN.`);
                count++;
            }
        }
    }

    if (count === 0) console.log("No users found with exact name 'İlhami İLHAN'.");
}

updateIlhamiExact().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
