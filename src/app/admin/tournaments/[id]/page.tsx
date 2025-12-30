'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, setDoc, deleteDoc, updateDoc, increment, serverTimestamp, where, getDocs, runTransaction, writeBatch, orderBy, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Trophy, Users, Calendar, Settings, Plus, Search, Trash2, User as UserIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Tournament } from '../page';

interface Participant {
    id: string; // Document ID (usually same as playerID)
    playerId: string;
    fullName: string;
    handicap?: number;
    isSeeded?: boolean;
    addedAt: any;
}

interface Player {
    id: string;
    fullName: string;
    handicap?: number;
    salonId: string;
}

interface Match {
    id: string;
    round: number;
    matchIndex: number; // Index within the round (0, 1, 2...)
    player1Id: string | null;
    player1Name: string | null;
    player2Id: string | null;
    player2Name: string | null;
    score1: number | null;
    score2: number | null;
    innings1?: number | null;
    innings2?: number | null;
    highRun1?: number | null;
    highRun2?: number | null;
    winnerId: string | null;
    nextMatchId: string | null; // ID of the match the winner advances to
    status: 'pending' | 'active' | 'completed';
    createdAt: any;
}

export default function TournamentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const { user } = useAuth();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);

    // Participants State
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Guest Player State
    const [guestName, setGuestName] = useState('');
    const [guestHandicap, setGuestHandicap] = useState('');

    // Score Entry Modal State
    const [isScoreOpen, setIsScoreOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [scoreForm, setScoreForm] = useState({
        score1: '',
        score2: '',
        innings: '',
        highRun1: '',
        highRun2: ''
    });

    useEffect(() => {
        const fetchTournament = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'tournaments', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTournament({ id: docSnap.id, ...docSnap.data() } as Tournament);
                }
            } catch (error) {
                console.error("Error fetching tournament:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTournament();
    }, [id]);

    // Fetch Participants Real-time
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, `tournaments/${id}/participants`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Participant[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Participant);
            });
            // Sort: Seeded first, then by name
            data.sort((a, b) => {
                if (a.isSeeded && !b.isSeeded) return -1;
                if (!a.isSeeded && b.isSeeded) return 1;
                return a.fullName.localeCompare(b.fullName);
            });
            setParticipants(data);
        });
        return () => unsubscribe();
    }, [id]);

    // Fetch Matches Real-time
    useEffect(() => {
        if (!id) return;
        // Remove orderBy to avoid index issues. Sort client-side.
        const q = query(collection(db, `tournaments/${id}/matches`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Match[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Match);
            });
            // Client-side sort: Round ASC, then MatchIndex ASC
            data.sort((a, b) => {
                if (a.round !== b.round) return a.round - b.round;
                return a.matchIndex - b.matchIndex;
            });
            setMatches(data);
        }, (error) => {
            console.error("Error fetching matches:", error);
        });
        return () => unsubscribe();
    }, [id]);

    // Fetch Available Players when modal opens
    useEffect(() => {
        const fetchPlayers = async () => {
            if (isAddPlayerOpen && tournament?.salonId) {
                try {
                    const q = query(collection(db, 'players'), where('salonId', '==', tournament.salonId));
                    const snapshot = await getDocs(q);
                    const players: Player[] = [];
                    snapshot.forEach((doc) => {
                        players.push({ id: doc.id, ...doc.data() } as Player);
                    });
                    setAvailablePlayers(players);
                } catch (error) {
                    console.error("Error fetching players:", error);
                }
            }
        };
        fetchPlayers();
    }, [isAddPlayerOpen, tournament?.salonId]);

    const handleAddParticipant = async (player: Player) => {
        if (!tournament) return;

        // Limit Check
        if (tournament.targetParticipantCount && participants.length >= tournament.targetParticipantCount) {
            alert(`Maksimum oyuncu sayısına (${tournament.targetParticipantCount}) ulaşıldı.`);
            return;
        }

        // Check if already added
        if (participants.some(p => p.playerId === player.id)) {
            alert("Bu oyuncu zaten ekli.");
            return;
        }

        try {
            await runTransaction(db, async (transaction) => {
                const participantRef = doc(collection(db, `tournaments/${id}/participants`));
                const tournamentRef = doc(db, 'tournaments', id);

                transaction.set(participantRef, {
                    playerId: player.id,
                    fullName: player.fullName,
                    handicap: player.handicap || 0,
                    isSeeded: false,
                    addedAt: serverTimestamp()
                });

                transaction.update(tournamentRef, {
                    participantCount: increment(1)
                });
            });

            // Local update for UI responsiveness if needed, but onSnapshot handles it
        } catch (error) {
            console.error("Error adding participant:", error);
        }
    };

    const handleAddGuestPlayer = async () => {
        if (!tournament || !guestName.trim()) return;

        // Limit Check
        if (tournament.targetParticipantCount && participants.length >= tournament.targetParticipantCount) {
            alert(`Maksimum oyuncu sayısına (${tournament.targetParticipantCount}) ulaşıldı.`);
            return;
        }

        try {
            await runTransaction(db, async (transaction) => {
                // Generate a random ID for guest player so they act like a player
                const guestRef = doc(collection(db, `tournaments/${id}/participants`));
                const tournamentRef = doc(db, 'tournaments', id);

                transaction.set(guestRef, {
                    playerId: `guest_${Date.now()}`,
                    fullName: guestName,
                    handicap: Number(guestHandicap) || 0,
                    isSeeded: false,
                    addedAt: serverTimestamp()
                });

                transaction.update(tournamentRef, {
                    participantCount: increment(1)
                });
            });

            setGuestName('');
            setGuestHandicap('');
            // Don't close modal to allow bulk add
        } catch (error) {
            console.error("Error adding guest participant:", error);
        }
    };

    const handleRemoveParticipant = async (participantId: string) => {
        if (!confirm('Oyuncuyu turnuvadan çıkarmak istediğinize emin misiniz?')) return;

        try {
            await runTransaction(db, async (transaction) => {
                const participantRef = doc(db, `tournaments/${id}/participants`, participantId);
                const tournamentRef = doc(db, 'tournaments', id);

                transaction.delete(participantRef);
                transaction.update(tournamentRef, {
                    participantCount: increment(-1)
                });
            });
        } catch (error) {
            console.error("Error removing participant:", error);
        }
    };

    const handleToggleSeeded = async (participant: Participant) => {
        try {
            await updateDoc(doc(db, `tournaments/${id}/participants`, participant.id), {
                isSeeded: !participant.isSeeded
            });
        } catch (error) {
            console.error("Error toggling seeded status:", error);
        }
    };

    const handleGenerateRound1 = async () => {
        if (!tournament || participants.length < 2 || !id) return;
        if (!confirm('1. Tur Fikstürünü oluşturmak istediğinize emin misiniz?')) return;

        try {
            setLoading(true);
            const batch = writeBatch(db);

            // 1. Delete existing matches (Full reset if starting fresh) - BE CAREFUL
            // Only if no matches exist? Or force reset?
            // Let's assume this is initial generation.

            // Filter players for Round 1
            let round1Players = [...participants];

            // If Seeded players skip R1
            const joinRound = Number(tournament.seededJoinRound);
            if (tournament.hasSeededPlayers && joinRound && joinRound > 1) {
                round1Players = round1Players.filter(p => !p.isSeeded);
            }

            if (round1Players.length < 2) {
                alert("1. Tur için yeterli oyuncu yok (Seri başları hariç en az 2 oyuncu gerekli).");
                setLoading(false);
                return;
            }

            // Shuffle (Fisher-Yates)
            const shuffled = [...round1Players];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // Pair them
            const matchCount = Math.ceil(shuffled.length / 2);

            for (let i = 0; i < matchCount; i++) {
                const p1 = shuffled[i * 2];
                const p2 = shuffled[i * 2 + 1]; // Can be undefined if odd

                const matchRef = doc(collection(db, `tournaments/${id}/matches`));
                // Use explicit nulls to avoid 'undefined' errors in Firestore
                const matchData: any = {
                    round: 1,
                    matchIndex: i,
                    player1Id: p1?.playerId || null,
                    player1Name: p1?.fullName || 'Bilinmeyen',
                    player2Id: p2?.playerId || null,
                    player2Name: p2?.fullName || null,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    score1: null,
                    score2: null,
                    innings1: null,
                    innings2: null,
                    winnerId: null
                };

                // Bye handling
                if (!p2) {
                    matchData.status = 'completed';
                    matchData.winnerId = p1.playerId;
                    matchData.score1 = 0;
                    matchData.score2 = 0;
                    matchData.innings1 = 0;
                    matchData.innings2 = 0;
                    matchData.notes = 'Bay geçti';
                }

                batch.set(matchRef, matchData);
            }

            // Update tournament status
            batch.update(doc(db, 'tournaments', id), {
                status: 'active',
                startDate: serverTimestamp(),
                currentRound: 1
            });

            await batch.commit();
            setLoading(false);
            alert("1. Tur fikstürü başarıyla oluşturuldu.");

        } catch (error) {
            console.error("Error generating fixtures:", error);
            alert("Fikstür oluşturulurken bir hata oluştu: " + error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedMatch) {
            setScoreForm({
                score1: selectedMatch.score1?.toString() || '',
                score2: selectedMatch.score2?.toString() || '',
                innings: selectedMatch.innings1?.toString() || '',
                highRun1: selectedMatch.highRun1?.toString() || '',
                highRun2: selectedMatch.highRun2?.toString() || ''
            });
        }
    }, [selectedMatch]);

    const handleUpdateMatchScore = async () => {
        if (!selectedMatch || !selectedMatch.player1Id || !selectedMatch.player2Id) return;

        const s1 = parseInt(scoreForm.score1) || 0;
        const s2 = parseInt(scoreForm.score2) || 0;
        const inn = parseInt(scoreForm.innings) || 1;
        const hr1 = parseInt(scoreForm.highRun1) || 0;
        const hr2 = parseInt(scoreForm.highRun2) || 0;

        const winnerId = s1 > s2 ? selectedMatch.player1Id : s2 > s1 ? selectedMatch.player2Id : null;
        if (!winnerId) {
            alert("Beraberlik durumunda kazanan belirlenemez. Lütfen bir kazanan çıkana kadar oynatın (Penaltılar vs).");
            return;
        }

        try {
            await updateDoc(doc(db, `tournaments/${id}/matches`, selectedMatch.id), {
                score1: s1,
                score2: s2,
                innings1: inn,
                innings2: inn,
                highRun1: hr1,
                highRun2: hr2,
                winnerId,
                status: 'completed'
            });

            setIsScoreOpen(false);
            setSelectedMatch(null);

        } catch (error) {
            console.error("Error updating match:", error);
            alert("Skor güncellenirken hata oluştu.");
        }
    };

    const handleGenerateNextRound = async () => {
        if (!tournament) return;

        // 1. Determine Current Round
        const currentRound = matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 0;
        const nextRound = currentRound + 1;

        // 2. Get Winners from Current Round
        const currentRoundMatches = matches.filter(m => m.round === currentRound);
        if (currentRoundMatches.length === 0) {
            alert("Önceki turda hiç maç bulunamadı.");
            return;
        }

        if (currentRoundMatches.some(m => m.status !== 'completed')) {
            alert("Lütfen önce tüm maçları tamamlayın.");
            return;
        }

        const winnersIds = currentRoundMatches.map(m => m.winnerId).filter(id => id !== null) as string[];

        // 3. Get Participants objects for winners (to show names)
        const winners = participants.filter(p => winnersIds.includes(p.playerId));

        // 4. Check for Seeded Players joining this round
        let roundPool: (Participant & { avg: number })[] = [];

        // Calculate Averages for sorting (U System)
        // We need to fetch stats from previous matches for these winners.
        const playerStatsPromises = winners.map(async (p) => {
            // Find the match where this player won in the current round
            const match = currentRoundMatches.find(m => m.winnerId === p.playerId);
            let avg = 0;
            if (match) {
                const score = match.player1Id === p.playerId ? match.score1 : match.score2;
                const innings = match.player1Id === p.playerId ? match.innings1 : match.innings2;
                if (score !== null && score !== undefined && innings !== null && innings !== undefined && innings > 0) {
                    avg = score / innings;
                }
            }
            return { ...p, avg };
        });

        const poolWithStats = await Promise.all(playerStatsPromises);
        roundPool = [...poolWithStats];

        // Add Seeded Players if joining now
        if (tournament?.hasSeededPlayers && tournament.seededJoinRound === nextRound) {
            const seededPlayers = participants.filter(p => p.isSeeded);
            // Seeded players assume high rank? Or handled separately?
            // "seri başı var ise ve seçildi ise kalan oyuncular 1 . turdaki ortalamalarına göre U sistemi"
            // This implies Seeded players are matched against the U-sorted qualifiers? or mixed?
            // Usually Seeded top vs Qualifier Bottom.
            // Let's Add them to the pool with a 'high' dummy avg to sort them to top?
            seededPlayers.forEach(sp => {
                // Check if seeded player is already in the pool (e.g., if they played in R1 and won)
                if (!roundPool.some(p => p.playerId === sp.playerId)) {
                    roundPool.push({ ...sp, avg: 999999 }); // Force top rank for new seeded players
                }
            });
        }

        if (roundPool.length < 2) {
            alert("Bir sonraki tur için yeterli oyuncu yok.");
            return;
        }

        // 5. Sort by Average DESC
        roundPool.sort((a, b) => b.avg - a.avg);

        // 6. U - System Pairing (1 vs Last, 2 vs Second Last...)
        const newMatches = [];
        const poolSize = roundPool.length;
        const matchCount = Math.floor(poolSize / 2);

        for (let i = 0; i < matchCount; i++) {
            const topSeed = roundPool[i];
            const bottomSeed = roundPool[poolSize - 1 - i];

            newMatches.push({
                p1: topSeed,
                p2: bottomSeed
            });
        }

        // If odd number of players, one gets a bye
        if (poolSize % 2 !== 0) {
            const byePlayer = roundPool[matchCount]; // The middle player
            newMatches.push({
                p1: byePlayer,
                p2: null // Indicates a bye
            });
        }

        // 7. Write to DB
        const batch = writeBatch(db);
        newMatches.forEach((m, idx) => {
            const matchRef = doc(collection(db, `tournaments/${id}/matches`));
            const matchData: any = {
                round: nextRound,
                matchIndex: idx,
                player1Id: m.p1.playerId,
                player1Name: m.p1.fullName,
                player2Id: m.p2 ? m.p2.playerId : null,
                player2Name: m.p2 ? m.p2.fullName : null,
                status: 'pending',
                createdAt: serverTimestamp()
            };

            if (!m.p2) { // Bye handling for next rounds
                matchData.status = 'completed';
                matchData.winnerId = m.p1.playerId;
                matchData.score1 = 0;
                matchData.score2 = 0;
                matchData.innings1 = 0;
                matchData.innings2 = 0;
                matchData.notes = 'Bay geçti';
            }

            batch.set(matchRef, matchData);
        });

        // Update tournament's current round
        batch.update(doc(db, 'tournaments', id), {
            currentRound: nextRound
        });

        try {
            await batch.commit();
            alert(`${nextRound}. Tur fikstürü başarıyla oluşturuldu.`);
        } catch (error) {
            console.error("Error generating next round:", error);
            alert("Bir sonraki tur fikstürü oluşturulurken hata oluştu.");
        }
    };

    const filteredPlayers = availablePlayers.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !participants.some(part => part.playerId === p.id)
    );

    // Stats Calculation
    const getPlayerStats = () => {
        const stats: any[] = [];

        participants.forEach(p => {
            const playerMatches = matches.filter(m => (m.player1Id === p.playerId || m.player2Id === p.playerId) && m.status === 'completed');
            let totalScore = 0;
            let totalInnings = 0;
            let wins = 0;
            let matchesPlayed = 0;
            let highRun = 0; // Not tracked yet, but placeholder

            playerMatches.forEach(m => {
                matchesPlayed++;
                if (m.winnerId === p.playerId) wins++;

                if (m.player1Id === p.playerId) {
                    totalScore += m.score1 || 0;
                    totalInnings += m.innings1 || 0;
                } else {
                    totalScore += m.score2 || 0;
                    totalInnings += m.innings2 || 0;
                }
            });

            const avg = totalInnings > 0 ? totalScore / totalInnings : 0;

            if (matchesPlayed > 0) {
                stats.push({
                    ...p,
                    matchesPlayed,
                    wins,
                    totalScore,
                    totalInnings,
                    avg,
                    highRun
                });
            }
        });

        return stats.sort((a, b) => b.avg - a.avg);
    };

    const handleDownloadExcel = () => {
        // Mock download for now or simple CSV
        const stats = getPlayerStats();
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Sıra,Oyuncu,Oynadığı,Galibiyet,Puan,Istaka,Ortalama\n";

        stats.forEach((p, index) => {
            csvContent += `${index + 1},${p.fullName},${p.matchesPlayed},${p.wins},${p.totalScore},${p.totalInnings},${p.avg.toFixed(3)}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${tournament?.name}_istatistikler.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>;
    if (!tournament) return <div className="p-8 text-center text-slate-400">Turnuva bulunamadı.</div>;

    const playerStats = getPlayerStats();

    return (
        <div className="flex h-screen bg-[#0b1120] text-slate-50 font-sans overflow-hidden">
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => router.back()}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                <span className="flex items-center gap-1"><Trophy size={14} /> {tournament.type === 'grand_prix' ? 'Grand Prix' : 'Handikaplı'}</span>
                                <span className="flex items-center gap-1"><Users size={14} /> {participants.length} Oyuncu</span>
                            </div>
                        </div>
                        <div className="ml-auto flex gap-2">
                            <Button variant="outline" className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
                                <Settings size={18} className="mr-2" /> Ayarlar
                            </Button>
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <Tabs defaultValue="participants" className="space-y-6">
                        <TabsList className="bg-slate-900/50 border border-slate-800 p-1">
                            <TabsTrigger value="participants" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Oyuncular</TabsTrigger>
                            <TabsTrigger value="fixtures" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Fikstür / Eşleşmeler</TabsTrigger>
                            <TabsTrigger value="standings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Puan Durumu</TabsTrigger>
                            <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Grand Prix Sıralaması</TabsTrigger>
                        </TabsList>

                        <TabsContent value="participants">
                            <Card className="bg-slate-900/40 border-slate-800">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-white flex items-center gap-2">
                                            Kayıtlı Oyuncular
                                            {tournament?.targetParticipantCount && (
                                                <span className={`text-sm font-normal px-2 py-0.5 rounded-full border ${participants.length === tournament.targetParticipantCount
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                                    }`}>
                                                    {participants.length} / {tournament.targetParticipantCount} Eklendi
                                                </span>
                                            )}
                                        </CardTitle>
                                        <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    className={`${participants.length >= (tournament?.targetParticipantCount || 999) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'} gap-2`}
                                                    disabled={participants.length >= (tournament?.targetParticipantCount || 999)}
                                                >
                                                    <Plus size={16} /> Oyuncu Ekle
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
                                                <DialogHeader>
                                                    <DialogTitle>Turnuvaya Oyuncu Ekle</DialogTitle>
                                                    <DialogDescription className="text-slate-400">
                                                        Sistemden veya manuel olarak oyuncu ekleyin.
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <Tabs defaultValue="database" className="w-full mt-2">
                                                    <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                                                        <TabsTrigger value="database">Sistemden</TabsTrigger>
                                                        <TabsTrigger value="manual">Manuel (Misafir)</TabsTrigger>
                                                    </TabsList>

                                                    <TabsContent value="database" className="space-y-4 pt-4">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                                            <Input
                                                                placeholder="Oyuncu ara..."
                                                                className="pl-9 bg-slate-800 border-slate-700"
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                            {filteredPlayers.map(player => (
                                                                <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors">
                                                                    <div>
                                                                        <div className="font-medium text-white">{player.fullName}</div>
                                                                        <div className="text-xs text-slate-500">Handikap: {player.handicap || 0}</div>
                                                                    </div>
                                                                    <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={() => handleAddParticipant(player)}>
                                                                        Ekle
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            {filteredPlayers.length === 0 && (
                                                                <div className="text-center py-8 text-slate-500">
                                                                    Oyuncu bulunamadı.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TabsContent>

                                                    <TabsContent value="manual" className="space-y-4 pt-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300">Ad Soyad</Label>
                                                            <Input
                                                                placeholder="Örn. Mehmet Demir"
                                                                className="bg-slate-800 border-slate-700"
                                                                value={guestName}
                                                                onChange={(e) => setGuestName(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-slate-300">Handikap (Opsiyonel)</Label>
                                                            <Input
                                                                type="number"
                                                                placeholder="0"
                                                                className="bg-slate-800 border-slate-700"
                                                                value={guestHandicap}
                                                                onChange={(e) => setGuestHandicap(e.target.value)}
                                                            />
                                                        </div>
                                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddGuestPlayer}>
                                                            Listeye Ekle
                                                        </Button>
                                                    </TabsContent>
                                                </Tabs>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {participants.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500">
                                            Henüz oyuncu eklenmemiş.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {participants.map((participant) => (
                                                <div
                                                    key={participant.id}
                                                    className={`
                                                        flex items-center justify-between p-4 rounded-xl border transition-all 
                                                        ${tournament?.targetParticipantCount && participants.length === tournament.targetParticipantCount
                                                            ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_10px_-3px_rgba(34,197,94,0.2)]' // Completed Full List Style
                                                            : participant.isSeeded
                                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                                : 'bg-slate-800/30 border-slate-700/50 group hover:border-blue-500/30'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${participant.isSeeded ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                                                            {participant.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-white flex items-center gap-2">
                                                                {participant.fullName}
                                                                {participant.isSeeded && <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-0 text-[10px] px-1.5 py-0 h-5">SB</Badge>}
                                                            </div>
                                                            <div className="text-xs text-slate-500">Handikap: {participant.handicap}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {tournament?.hasSeededPlayers && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={`h-8 text-xs ${participant.isSeeded ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400'}`}
                                                                onClick={() => handleToggleSeeded(participant)}
                                                                title={participant.isSeeded ? "Seri Başı Kaldır" : "Seri Başı Yap"}
                                                            >
                                                                <Trophy size={14} />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-opacity"
                                                            onClick={() => handleRemoveParticipant(participant.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="fixtures">
                            <Card className="bg-slate-900/40 border-slate-800">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-white">Fikstür ve Maçlar</CardTitle>
                                        <div className="flex gap-2">
                                            {matches.length === 0 ? (
                                                <Button
                                                    onClick={handleGenerateRound1}
                                                    disabled={participants.length < 2}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    1. Tur Fikstürü Oluştur
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        onClick={handleGenerateNextRound}
                                                        disabled={matches.some(m => m.status !== 'completed')}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        Bir Sonraki Turu Oluştur
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            if (confirm('Tüm eşleşmeler silinecek. Emin misiniz?')) {
                                                                // This is a quick clean up, should probably be a real function
                                                                const batch = writeBatch(db);
                                                                matches.forEach(m => batch.delete(doc(db, `tournaments/${id}/matches`, m.id)));
                                                                batch.update(doc(db, 'tournaments', id), { status: 'draft', currentRound: 0 });
                                                                batch.commit();
                                                            }
                                                        }}
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                                    >
                                                        Fikstürü Sıfırla
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {matches.length === 0 ? (
                                        <div className="py-12 text-center text-slate-500">
                                            Eşleşmeler henüz oluşturulmadı.
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {/* Group by rounds */}
                                            {Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b).map(round => (
                                                <div key={round} className="space-y-4">
                                                    <h3 className="text-lg font-bold text-blue-400 border-b border-blue-500/20 pb-2">
                                                        {round}. Tur
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {matches.filter(m => m.round === round).map(match => (
                                                            <div key={match.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col gap-3">
                                                                <div className="flex justify-between items-center text-sm text-slate-400 mb-1">
                                                                    <span>Maç #{match.matchIndex + 1}</span>
                                                                    <span className={match.status === 'completed' ? 'text-green-500' : 'text-slate-500'}>
                                                                        {match.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                                                                    </span>
                                                                </div>

                                                                {/* Player 1 */}
                                                                <div className={`flex justify-between items-center p-2 rounded ${match.winnerId === match.player1Id ? 'bg-green-500/20 text-green-400' : 'bg-slate-900/50'}`}>
                                                                    <div className="flex flex-col">
                                                                        <span className={match.player1Id ? 'text-white' : 'text-slate-500 italic'}>
                                                                            {match.player1Name || 'Belirlenmedi'}
                                                                        </span>
                                                                        {match.status === 'completed' && match.innings1 && (
                                                                            <span className="text-[10px] text-slate-500">Ort: {(match.score1! / match.innings1).toFixed(3)} ({match.innings1} ıst)</span>
                                                                        )}
                                                                    </div>
                                                                    {match.status === 'completed' ? (
                                                                        <span className="font-bold text-lg">{match.score1}</span>
                                                                    ) : (
                                                                        match.player1Id && match.player2Id && <span className="text-slate-500">-</span>
                                                                    )}
                                                                </div>

                                                                {/* Player 2 */}
                                                                <div className={`flex justify-between items-center p-2 rounded ${match.winnerId === match.player2Id ? 'bg-green-500/20 text-green-400' : 'bg-slate-900/50'}`}>
                                                                    <div className="flex flex-col">
                                                                        <span className={match.player2Id ? 'text-white' : 'text-slate-500 italic'}>
                                                                            {match.player2Name || (match.round === 1 ? 'BAY' : 'Belirlenmedi')}
                                                                        </span>
                                                                        {match.status === 'completed' && match.innings2 && (
                                                                            <span className="text-[10px] text-slate-500">Ort: {(match.score2! / match.innings2).toFixed(3)} ({match.innings2} ıst)</span>
                                                                        )}
                                                                    </div>
                                                                    {match.status === 'completed' ? (
                                                                        <span className="font-bold text-lg">{match.score2}</span>
                                                                    ) : (
                                                                        match.player1Id && match.player2Id && <span className="text-slate-500">-</span>
                                                                    )}
                                                                </div>

                                                                {/* Action: Enter Result */}
                                                                {match.status !== 'completed' && match.player1Id && match.player2Id && (
                                                                    <Button
                                                                        className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs mt-2"
                                                                        onClick={() => {
                                                                            setSelectedMatch(match);
                                                                            setIsScoreOpen(true);
                                                                        }}
                                                                    >
                                                                        Skor Gir / Bitir
                                                                    </Button>
                                                                )}

                                                                {/* Completed Match Stats Display */}
                                                                {match.status === 'completed' && match.innings1 && (
                                                                    <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-400 bg-slate-900/40 p-2 rounded">
                                                                        <div className="text-center">
                                                                            <div className="font-bold text-slate-300">Ortalama</div>
                                                                            <div>{(match.score1! / match.innings1).toFixed(3)} - {(match.score2! / match.innings2!).toFixed(3)}</div>
                                                                        </div>
                                                                        <div className="text-center border-x border-slate-700">
                                                                            <div className="font-bold text-slate-300">Istaka</div>
                                                                            <div>{match.innings1}</div>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className="font-bold text-slate-300">EYS</div>
                                                                            <div>{match.highRun1 || 0} - {match.highRun2 || 0}</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Score Entry Modal */}
                        <Dialog open={isScoreOpen} onOpenChange={setIsScoreOpen}>
                            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
                                <DialogHeader>
                                    <DialogTitle>Maç Sonucu Gir</DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Lütfen maç skorunu ve istatistikleri giriniz.
                                    </DialogDescription>
                                </DialogHeader>
                                {selectedMatch && (
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4 items-center">
                                            <div className="text-center font-bold text-lg text-blue-400 truncate px-2">{selectedMatch.player1Name}</div>
                                            <div className="text-center font-bold text-lg text-blue-400 truncate px-2">{selectedMatch.player2Name}</div>
                                        </div>

                                        {/* Scores */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-400">Skor 1</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-slate-800 border-slate-700 text-center text-lg font-bold"
                                                    value={scoreForm.score1}
                                                    onChange={(e) => setScoreForm({ ...scoreForm, score1: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-400">Skor 2</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-slate-800 border-slate-700 text-center text-lg font-bold"
                                                    value={scoreForm.score2}
                                                    onChange={(e) => setScoreForm({ ...scoreForm, score2: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Shared Stats */}
                                        <div className="space-y-2">
                                            <Label className="text-xs text-slate-400">Istaka Sayısı (Ortak)</Label>
                                            <Input
                                                type="number"
                                                className="bg-slate-800 border-slate-700 text-center"
                                                value={scoreForm.innings}
                                                onChange={(e) => setScoreForm({ ...scoreForm, innings: e.target.value })}
                                            />
                                        </div>

                                        {/* High Runs */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-400">EYS (Oyuncu 1)</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-slate-800 border-slate-700 text-center"
                                                    value={scoreForm.highRun1}
                                                    onChange={(e) => setScoreForm({ ...scoreForm, highRun1: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-slate-400">EYS (Oyuncu 2)</Label>
                                                <Input
                                                    type="number"
                                                    className="bg-slate-800 border-slate-700 text-center"
                                                    value={scoreForm.highRun2}
                                                    onChange={(e) => setScoreForm({ ...scoreForm, highRun2: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <Button className="w-full bg-green-600 hover:bg-green-700 mt-4" onClick={handleUpdateMatchScore}>
                                            Maçı Kaydet ve Bitir
                                        </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>

                        <TabsContent value="standings">
                            <div className="text-center py-12 text-slate-500">
                                Puan durumu henüz aktif değil. "Grand Prix Sıralaması" sekmesini kullanın.
                            </div>
                        </TabsContent>

                        <TabsContent value="stats">
                            <Card className="bg-slate-900/40 border-slate-800">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-white">Genel İstatistikler / Sıralama</CardTitle>
                                        <Button
                                            variant="outline"
                                            className="border-slate-700 hover:bg-slate-800"
                                            onClick={handleDownloadExcel}
                                        >
                                            <Download size={16} className="mr-2" /> Excel İndir
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg border border-slate-800 overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                                                <tr>
                                                    <th className="px-4 py-3">Sıra</th>
                                                    <th className="px-4 py-3">Oyuncu</th>
                                                    <th className="px-4 py-3 text-center">Maç</th>
                                                    <th className="px-4 py-3 text-center">G</th>
                                                    <th className="px-4 py-3 text-center">Puan</th>
                                                    <th className="px-4 py-3 text-center">Istaka</th>
                                                    <th className="px-4 py-3 text-center">Ort</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {playerStats.map((stat, index) => (
                                                    <tr key={stat.id} className="hover:bg-slate-800/30">
                                                        <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                                                        <td className="px-4 py-3 text-white font-medium">{stat.fullName}</td>
                                                        <td className="px-4 py-3 text-center text-slate-300">{stat.matchesPlayed}</td>
                                                        <td className="px-4 py-3 text-center text-green-400">{stat.wins}</td>
                                                        <td className="px-4 py-3 text-center text-slate-300">{stat.totalScore}</td>
                                                        <td className="px-4 py-3 text-center text-slate-300">{stat.totalInnings}</td>
                                                        <td className="px-4 py-3 text-center text-blue-400 font-bold">{stat.avg.toFixed(3)}</td>
                                                    </tr>
                                                ))}
                                                {playerStats.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                                            Henüz istatistik oluşmadı.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
