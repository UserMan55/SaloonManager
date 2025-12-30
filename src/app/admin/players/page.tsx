'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { Plus, Search, Trash2, Edit2, User as UserIcon, Globe, MapPin, Download, AlertCircle } from 'lucide-react';
// import { SALON_ID } from '@/lib/constants'; // Artık kullanılmıyor
import { useAuth } from '@/context/AuthContext';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface Player {
    id: string;
    fullName: string;
    // nickname removed
    phone?: string;
    handicap?: number;
    salonId: string;
    city?: string;
    photoURL?: string; // Added photo support
    stats: {
        matches: number;
        wins: number;
        avg: number;
    };
}

interface PoolUser {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    city?: string;
    salonId?: string;
    photoURL?: string; // Added photo support
}

interface PlayersPageProps {
    forcedSalonId?: string | null;
}

export default function PlayersPage({ forcedSalonId }: PlayersPageProps) {
    const { salonId: authSalonId, user } = useAuth(); // AuthContext'ten gelen 
    const salonId = forcedSalonId || authSalonId; // Prop varsa onu kullan (Override/Impersonate)

    const [players, setPlayers] = useState<Player[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Salon Bilgisi
    const [salonCity, setSalonCity] = useState<string | null>(null);
    const [salonName, setSalonName] = useState<string>('');

    // Havuz İşlemleri
    const [poolUsers, setPoolUsers] = useState<PoolUser[]>([]);
    const [poolSearchTerm, setPoolSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('manual');

    // Form State
    const [fullName, setFullName] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [handicap, setHandicap] = useState('');

    // Salon Bilgisini Çek (Dinamik)
    useEffect(() => {
        const fetchSalonInfo = async () => {
            if (!salonId) {
                setLoading(false); // Salon ID yoksa loading'i durdur (Boş ekran yerine uyarı gösterilebilir)
                return;
            }

            try {
                const docRef = doc(db, 'salons', salonId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSalonCity(data.city || null);
                    setSalonName(data.name || '');
                }
            } catch (error) {
                console.error("Salon bilgisi çekilemedi:", error);
            }
        };
        fetchSalonInfo();
    }, [salonId]);

    // Mevcut Oyuncuları Çek (Real-time)
    useEffect(() => {
        if (!salonId) return;

        const q = query(
            collection(db, 'players'),
            where('salonId', '==', salonId)
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
    }, [salonId]);

    // Havuzdaki Kullanıcıları Getir
    useEffect(() => {
        const fetchPoolUsers = async () => {
            if (activeTab === 'pool' && isModalOpen && salonCity) {
                try {
                    const q = query(
                        collection(db, 'users'),
                        where('city', '==', salonCity)
                    );
                    const querySnapshot = await getDocs(q);
                    const users: PoolUser[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        users.push({
                            id: doc.id,
                            fullName: data.name || data.fullName || 'İsimsiz',
                            email: data.email,
                            phone: data.phone,
                            city: data.city,
                            salonId: data.salonId,
                            photoURL: data.photoURL // Fetch photoURL
                        });
                    });
                    setPoolUsers(users);
                } catch (error) {
                    console.error("Havuz kullanıcıları çekilemedi:", error);
                }
            }
        };
        fetchPoolUsers();
    }, [activeTab, isModalOpen, salonCity]);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!salonId) return;

        try {
            await addDoc(collection(db, 'players'), {
                fullName,
                phone,
                handicap: Number(handicap) || 0,
                salonId: salonId,
                createdAt: serverTimestamp(),
                stats: { matches: 0, wins: 0, avg: 0 }
            });
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error adding player: ", error);
        }
    };

    const handleImportPoolUser = async (user: PoolUser) => {
        if (!salonId) return;
        // Kullanıcıya onay sor (Tarayıcı native confirm)
        if (!confirm(`${user.fullName} adlı oyuncuyu salonunuza eklemek istiyor musunuz?`)) return;

        try {
            await addDoc(collection(db, 'players'), {
                fullName: user.fullName,
                phone: user.phone || '',
                email: user.email || '',
                userId: user.id,
                handicap: 0,
                salonId: salonId,
                city: salonCity,
                photoURL: user.photoURL || null, // Save photoURL
                createdAt: serverTimestamp(),
                stats: { matches: 0, wins: 0, avg: 0 }
            });

            try {
                const userRef = doc(db, 'users', user.id);
                await updateDoc(userRef, {
                    salonId: salonId,
                    salonName: salonName
                });
            } catch (linkError) {
                console.log("Kullanıcı profili güncellenemedi (Yetki sorunu olabilir), ancak oyuncu listeye eklendi.", linkError);
            }

            setIsModalOpen(false);
        } catch (error) {
            console.error("İçe aktarma hatası:", error);
            alert("Oyuncu eklenirken bir hata oluştu.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu oyuncuyu silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, 'players', id));
        }
    };

    const resetForm = () => {
        setFullName('');
        // setNickname removed
        setPhone('');
        setHandicap('');
    };

    const filteredPlayers = players.filter(player =>
        player.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPoolUsers = poolUsers.filter(u =>
        u.fullName.toLowerCase().includes(poolSearchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(poolSearchTerm.toLowerCase()))
    );

    if (!salonId && !loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <AlertCircle size={48} className="mb-4 text-orange-500" />
                <h3 className="text-xl font-bold text-white mb-2">Salon Bulunamadı</h3>
                <p>Hesabınızla ilişkilendirilmiş bir salon bulunamadı.</p>
                <p className="text-sm mt-2">Lütfen Super Admin ile iletişime geçin.</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Oyuncu Yönetimi</h1>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        {salonCity ? (
                            <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-xs border border-blue-500/20">
                                <MapPin size={12} /> {salonCity}
                            </span>
                        ) : (
                            <span className="text-orange-400 text-xs">Salonun Şehir bilgisi eksik</span>
                        )}
                        <span>Salonunuza kayıtlı {players.length} oyuncu bulunuyor</span>
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 border-0">
                            <Plus size={18} />
                            Yeni Oyuncu Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-slate-900/95 border-slate-800 backdrop-blur-xl text-white">
                        <DialogHeader>
                            <DialogTitle>Yeni Oyuncu Ekle</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Manuel ekleme yapabilir veya 3CSCORE havuzundan oyuncu seçebilirsiniz.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                                <TabsTrigger value="manual">Manuel Ekle</TabsTrigger>
                                <TabsTrigger value="pool">Havuzdan Ekle ({salonCity || '?'})</TabsTrigger>
                            </TabsList>

                            {/* TAB 1: MANUEL EKLEME */}
                            <TabsContent value="manual" className="space-y-4 pt-4">
                                <form onSubmit={handleAddPlayer} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-slate-300">Ad Soyad</Label>
                                        <Input
                                            id="fullName"
                                            placeholder="örn. Ahmet Yılmaz"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            required
                                            className="bg-black/40 border-slate-700"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nickname" className="text-slate-300">Takma Ad</Label>
                                            <Input
                                                id="nickname"
                                                placeholder="Opsiyonel"
                                                value={nickname}
                                                onChange={e => setNickname(e.target.value)}
                                                className="bg-black/40 border-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="handicap" className="text-slate-300">Handikap</Label>
                                            <Input
                                                id="handicap"
                                                type="number"
                                                placeholder="0"
                                                value={handicap}
                                                onChange={e => setHandicap(e.target.value)}
                                                className="bg-black/40 border-slate-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-slate-300">Telefon (Opsiyonel)</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="5XX ..."
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            className="bg-black/40 border-slate-700"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                                        Oyuncuyu Kaydet
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* TAB 2: HAVUZDAN EKLEME */}
                            <TabsContent value="pool" className="space-y-4 pt-4">
                                {!salonCity ? (
                                    <div className="text-center p-6 text-orange-400 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                        <p className="text-sm font-semibold">Salon Şehir Bilgisi Eksik</p>
                                        <p className="text-xs mt-1">Bu özelliği kullanmak için Super Admin panelinden salona şehir eklemelisiniz.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                            <Input
                                                placeholder={`${salonCity} içindeki oyuncuları ara...`}
                                                value={poolSearchTerm}
                                                onChange={(e) => setPoolSearchTerm(e.target.value)}
                                                className="pl-9 bg-black/40 border-slate-700 h-9 text-sm"
                                            />
                                        </div>

                                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {filteredPoolUsers.length === 0 ? (
                                                <div className="text-center py-8 text-slate-500">
                                                    <p>Bu şehirde uygun oyuncu bulunamadı.</p>
                                                </div>
                                            ) : (
                                                filteredPoolUsers.map(poolUser => (
                                                    <div key={poolUser.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 group transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/30 overflow-hidden">
                                                                {poolUser.photoURL ? (
                                                                    <img src={poolUser.photoURL} alt={poolUser.fullName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    poolUser.fullName.substring(0, 1)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-200">{poolUser.fullName}</p>
                                                                <p className="text-[10px] text-slate-500">{poolUser.city}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-7 text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white"
                                                            onClick={() => handleImportPoolUser(poolUser)}
                                                        >
                                                            <Download size={12} className="mr-1.5" /> Ekle
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                    type="text"
                    placeholder="Liste içinde isim veya takma ada göre ara..."
                    className="pl-11 bg-slate-900/40 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500/50 rounded-xl h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Player List */}
            <Card className="bg-slate-900/40 border-0 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Oyuncular yükleniyor...</p>
                        </div>
                    ) : filteredPlayers.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                <UserIcon size={32} className="text-slate-600" />
                            </div>
                            <p className="text-white font-medium mb-1">
                                {searchTerm ? 'Sonuç bulunamadı' : 'Henüz oyuncu yok'}
                            </p>
                            <p className="text-slate-500 text-sm">
                                {searchTerm ? 'Farklı bir arama terimi deneyin' : 'İlk oyuncunuzu ekleyerek başlayın'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-800/50 bg-slate-800/20">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Oyuncu</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Genel Ortalama</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {filteredPlayers.map((player) => (
                                        <tr key={player.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20 overflow-hidden">
                                                        {player.photoURL ? (
                                                            <img src={player.photoURL} alt={player.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            player.fullName.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{player.fullName}</div>
                                                        <div className="text-[10px] text-slate-500">{player.phone || 'Tel Yok'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                    {player.stats?.avg ? player.stats.avg.toFixed(3) : '0.000'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                        <Edit2 size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                                        onClick={() => handleDelete(player.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
