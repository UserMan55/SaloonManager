'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Plus, Trophy, Calendar, Users, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface Tournament {
    id: string;
    name: string;
    type: 'grand_prix' | 'handicap';
    status: 'draft' | 'active' | 'completed';
    startDate: Timestamp | null;
    salonId: string;
    participantCount: number;
    targetParticipantCount?: number;
    hasSeededPlayers?: boolean;
    seededJoinRound?: number;
    createdAt: any;
}

interface TournamentsPageProps {
    forcedSalonId?: string | null;
}

export default function TournamentsPage({ forcedSalonId }: TournamentsPageProps) {
    const { salonId: authSalonId } = useAuth();
    const salonId = forcedSalonId || authSalonId;
    const router = useRouter();

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create Form State
    const [newTournamentName, setNewTournamentName] = useState('');
    const [newTournamentType, setNewTournamentType] = useState<'grand_prix' | 'handicap'>('grand_prix');

    // Grand Prix Specifics
    const [targetParticipantCount, setTargetParticipantCount] = useState<number>(32);
    const [isCustomCount, setIsCustomCount] = useState(false);
    const [hasSeededPlayers, setHasSeededPlayers] = useState(false);
    const [seededJoinRound, setSeededJoinRound] = useState(2);

    // Fetch Tournaments
    useEffect(() => {
        if (!salonId) return;

        const q = query(
            collection(db, 'tournaments'),
            where('salonId', '==', salonId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Tournament[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Tournament);
            });
            // Sort by creation date desc
            data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setTournaments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [salonId]);

    const handleCreateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!salonId) return;

        try {
            const data: any = {
                name: newTournamentName,
                type: newTournamentType,
                status: 'draft',
                startDate: null,
                salonId: salonId,
                participantCount: 0,
                createdAt: serverTimestamp(),
            };

            if (newTournamentType === 'grand_prix') {
                data.targetParticipantCount = targetParticipantCount;
                data.hasSeededPlayers = hasSeededPlayers;
                if (hasSeededPlayers) {
                    data.seededJoinRound = seededJoinRound;
                }
            }

            await addDoc(collection(db, 'tournaments'), data);

            setIsCreateModalOpen(false);
            setNewTournamentName('');
            setNewTournamentType('grand_prix');
            setTargetParticipantCount(32);
            setHasSeededPlayers(false);
        } catch (error) {
            console.error("Error creating tournament:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu turnuvayı silmek istediğinize emin misiniz? Tüm eşleşmeler silinecektir.')) {
            await deleteDoc(doc(db, 'tournaments', id));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
            case 'completed': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Devam Ediyor';
            case 'completed': return 'Tamamlandı';
            default: return 'Taslak';
        }
    };

    return (
        <div className="animate-fadeIn space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Turnuvalar</h1>
                    <p className="text-slate-400 text-sm">
                        Turnuvaları oluşturun, yönetin ve takip edin.
                    </p>
                </div>

                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 border-0 transition-all hover:scale-105">
                            <Plus size={18} />
                            Yeni Turnuva
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-[#0f172a] border-slate-800 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>Yeni Turnuva Oluştur</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Turnuva detaylarını girerek başlayın.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateTournament} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-300">Turnuva Adı</Label>
                                <Input
                                    id="name"
                                    placeholder="örn. 3 Bant Kış Kupası"
                                    value={newTournamentName}
                                    onChange={e => setNewTournamentName(e.target.value)}
                                    required
                                    className="bg-slate-900 border-slate-700 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-slate-300">Turnuva Tipi</Label>
                                <Select value={newTournamentType} onValueChange={(val: any) => setNewTournamentType(val)}>
                                    <SelectTrigger className="bg-slate-900 border-slate-700 focus:border-blue-500 transition-colors">
                                        <SelectValue placeholder="Tip Seçin" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="grand_prix">Grand Prix (Eleme Usulü)</SelectItem>
                                        <SelectItem value="handicap">Handikaplı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {newTournamentType === 'grand_prix' && (
                                <div className="space-y-4 pt-2 border-t border-slate-800">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Katılımcı Sayısı</Label>
                                        <div className="flex gap-2 mb-2">
                                            {[16, 32, 48, 64].map(count => (
                                                <Button
                                                    key={count}
                                                    type="button"
                                                    variant={!isCustomCount && targetParticipantCount === count ? "default" : "outline"}
                                                    className={`flex-1 ${!isCustomCount && targetParticipantCount === count ? 'bg-blue-600 border-blue-600' : 'bg-slate-900/50 border-slate-700'}`}
                                                    onClick={() => {
                                                        setTargetParticipantCount(count);
                                                        setIsCustomCount(false);
                                                    }}
                                                >
                                                    {count}
                                                </Button>
                                            ))}
                                            <Button
                                                type="button"
                                                variant={isCustomCount ? "default" : "outline"}
                                                className={`flex-1 ${isCustomCount ? 'bg-blue-600 border-blue-600' : 'bg-slate-900/50 border-slate-700'}`}
                                                onClick={() => setIsCustomCount(true)}
                                            >
                                                Özel
                                            </Button>
                                        </div>
                                        {isCustomCount && (
                                            <Input
                                                type="number"
                                                value={targetParticipantCount}
                                                onChange={e => setTargetParticipantCount(Number(e.target.value))}
                                                className="bg-slate-900 border-slate-700"
                                                min={2}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Seri Başı Var mı?</Label>
                                            <p className="text-xs text-slate-500">Belirli oyuncular sonraki turlardan başlar</p>
                                        </div>
                                        <Switch
                                            checked={hasSeededPlayers}
                                            onCheckedChange={setHasSeededPlayers}
                                        />
                                    </div>

                                    {hasSeededPlayers && (
                                        <div className="space-y-2 animate-fadeIn">
                                            <Label className="text-slate-300">Seri Başları Hangi Turdan Başlayacak?</Label>
                                            <Select value={seededJoinRound.toString()} onValueChange={(val) => setSeededJoinRound(Number(val))}>
                                                <SelectTrigger className="bg-slate-900 border-slate-700">
                                                    <SelectValue placeholder="Tur Seçin" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                    <SelectItem value="2">2. Tur</SelectItem>
                                                    <SelectItem value="3">3. Tur</SelectItem>
                                                    <SelectItem value="4">4. Tur</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                    Oluştur
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Yükleniyor...</p>
                </div>
            ) : tournaments.length === 0 ? (
                <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 border border-slate-700">
                            <Trophy size={40} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Henüz Turnuva Yok</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-8">
                            Salonunuzda heyecanı başlatın! İlk turnuvanızı oluşturarak oyuncuları davet edin.
                        </p>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Turnuva Oluştur
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tournaments.map((tournament) => (
                        <Card key={tournament.id} className="bg-slate-900/40 border-slate-800/50 hover:border-blue-500/30 transition-all group overflow-hidden cursor-pointer" onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}>
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                                    {/* Icon / Status */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 transition-colors ${tournament.status === 'active' ? 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20' :
                                            tournament.status === 'completed' ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' :
                                                'bg-slate-800/50 text-slate-400 group-hover:bg-slate-800'
                                            }`}>
                                            <Trophy size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                                {tournament.name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs">
                                                <Badge variant="outline" className={`border-0 uppercase tracking-widest font-semibold px-2 py-0.5 ${getStatusColor(tournament.status)}`}>
                                                    {getStatusText(tournament.status)}
                                                </Badge>
                                                <span className="text-slate-500 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {tournament.type === 'grand_prix' ? 'Grand Prix' : 'Handikaplı'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-8 sm:ml-auto text-sm text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-8">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1 font-bold">
                                                <Users size={12} /> Oyuncular
                                            </span>
                                            <span className="text-white font-medium text-lg">
                                                {tournament.participantCount || 0}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1 font-bold">
                                                <Calendar size={12} /> Başlangıç
                                            </span>
                                            <span className="text-white font-medium">
                                                {tournament.startDate ? new Date(tournament.startDate.seconds * 1000).toLocaleDateString('tr-TR') : 'Belirlenmedi'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="sm:ml-4 flex items-center">
                                        <Button className="w-full sm:w-auto bg-slate-800 hover:bg-blue-600 text-white border border-slate-700/50 hover:border-blue-500/50 gap-2 transition-all shadow-lg shadow-black/20">
                                            Yönet
                                            <ArrowRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
