'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SuperAdminPage() {
    const [salonName, setSalonName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState(''); // Just for visual confirmation or manual handling for now
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleCreateSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Create Salon Document
            const docRef = await addDoc(collection(db, 'salons'), {
                name: salonName,
                ownerEmail: adminEmail,
                createdAt: serverTimestamp(),
                tableCount: 0, // Default, to be updated by salon admin
                address: '',
                contactPhone: '',
                status: 'active'
            });

            setMessage(`Success! Salon created with ID: ${docRef.id}`);
            setSalonName('');
            setAdminEmail('');
            setAdminPassword('');

            // TODO: Implement actual user creation via Firebase Admin SDK (requires Service Account)
            console.log('TODO: Create user account for:', adminEmail, 'with password:', adminPassword);

        } catch (error: any) {
            console.error('Error adding salon: ', error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-8">
            <h1 className="h2 mb-6">Super Admin Dashboard</h1>

            <div className="card max-w-lg">
                <h2 className="h3 mb-4">Create New Salon</h2>

                {message && (
                    <div className={`p-4 mb-4 rounded ${message.startsWith('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleCreateSalon} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Salon Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. Star Billiards"
                            value={salonName}
                            onChange={(e) => setSalonName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Manager Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="manager@starbilliards.com"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Default Password</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Temporary Password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted mt-1">
                            * Note: User account must currently be created manually in Firebase Console or by the user on login.
                        </p>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Salon'}
                    </button>
                </form>
            </div>
        </div>
    );
}
