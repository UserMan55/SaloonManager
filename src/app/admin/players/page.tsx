'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Search, Trash2, Edit2, User as UserIcon } from 'lucide-react';
import { SALON_ID } from '@/lib/constants'; // Temporary hardcoded ID for dev

interface Player {
    id: string;
    fullName: string;
    nickname?: string;
    phone?: string;
    handicap?: number;
    salonId: string;
}

export default function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [fullName, setFullName] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [handicap, setHandicap] = useState('');

    // Fetch Players (Real-time)
    useEffect(() => {
        // Ensuring we only fetch players for THIS salon
        const q = query(
            collection(db, 'players'),
            where('salonId', '==', SALON_ID)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const playerData: Player[] = [];
            snapshot.forEach((doc) => {
                playerData.push({ id: doc.id, ...doc.data() } as Player);
            });
            setPlayers(playerData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'players'), {
                fullName,
                nickname,
                phone,
                handicap: Number(handicap) || 0,
                salonId: SALON_ID, // Critical: Binding player to this salon only
                createdAt: serverTimestamp(),
                stats: {
                    matches: 0,
                    wins: 0,
                    avg: 0
                }
            });
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error adding player: ", error);
            alert("Error adding player");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this player?')) {
            await deleteDoc(doc(db, 'players', id));
        }
    };

    const resetForm = () => {
        setFullName('');
        setNickname('');
        setPhone('');
        setHandicap('');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="h3">Player Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary gap-2"
                >
                    <Plus size={18} />
                    Add New Player
                </button>
            </div>

            {/* Search Bar Placeholder */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search players by name..."
                    className="input pl-10"
                />
            </div>

            {/* Player List */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading players...</div>
                ) : players.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <UserIcon size={48} className="mb-4 opacity-20" />
                        <p>No players found in this salon.</p>
                        <p className="text-sm">Add your first player to get started.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600">Name</th>
                                <th className="p-4 font-semibold text-slate-600">Nickname</th>
                                <th className="p-4 font-semibold text-slate-600">Level (HCP)</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player) => (
                                <tr key={player.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium">{player.fullName}</td>
                                    <td className="p-4 text-slate-500">{player.nickname || '-'}</td>
                                    <td className="p-4">
                                        <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                            {player.handicap}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button className="text-slate-400 hover:text-blue-600 p-1">
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(player.id)}
                                            className="text-slate-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Player Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h2 className="h4 mb-4">Add New Player</h2>
                        <form onSubmit={handleAddPlayer} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Ahmet Yılmaz"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nickname</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Optional"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Handicap</label>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="0"
                                        value={handicap}
                                        onChange={e => setHandicap(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="5XX ..."
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                >
                                    Save Player
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
