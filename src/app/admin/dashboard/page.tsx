'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    LayoutDashboard,
    Users,
    Trophy,
    LogOut,
    Target,
    Activity,
    UserCircle,
    Shield, // Shield import edildi
} from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Sub-page Import
import PlayersPage from '../players/page';

export default function DashboardPage() {
    const { user, logout, salonId: authSalonId, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Super Admin Impersonation Logic
    const querySalonId = searchParams.get('salonId');
    const activeSalonId = (role === 'super_admin' && querySalonId) ? querySalonId : authSalonId;

    const [activeTab, setActiveTab] = useState("overview");
    const [salonName, setSalonName] = useState("Yükleniyor...");
    const [salonLogo, setSalonLogo] = useState<string | null>(null);
    const [userFullName, setUserFullName] = useState<string>('');
    const [userPhoto, setUserPhoto] = useState<string | null>(null);

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    // Kullanıcı Bilgilerini Çek (İsim ve Resim)
    useEffect(() => {
        if (user) {
            const fetchUserInfo = async () => {
                try {
                    // 1. Önce Firestore'a bak
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (data.fullName) setUserFullName(data.fullName);
                        if (data.photoURL) setUserPhoto(data.photoURL);
                    } else {
                        // Doc yoksa default işlemleri yap
                        setUserFullName(user.displayName || user.email?.split('@')[0] || 'Kullanıcı');
                        setUserPhoto(user.photoURL || null);
                    }

                    // 2. Eğer hala isim yoksa Auth Profile'dan al
                    if (!userFullName && user.displayName) {
                        setUserFullName(user.displayName);
                    }
                    if (!userPhoto && user.photoURL) {
                        setUserPhoto(user.photoURL);
                    }

                    // 3. Super Admin Hardcoded Name Override
                    const email = user.email?.toLowerCase();
                    if (!userDoc.exists()) {
                        if (email === 'error_3@hotmail.com') setUserFullName('İbrahim TOPYILDIZ');
                        else if (email === 'ilhamiilhan55@gmail.com') setUserFullName('İlhami İLHAN');
                    }

                } catch (e) {
                    console.error("Kullanıcı bilgisi çekme hatası:", e);
                    setUserFullName(user.displayName || user.email?.split('@')[0] || 'Kullanıcı');
                }
            };
            fetchUserInfo();
        }
    }, [user]);

    // Salon Bilgilerini Çek
    useEffect(() => {
        const fetchSalonInfo = async () => {
            if (activeSalonId) {
                try {
                    const docRef = doc(db, 'salons', activeSalonId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setSalonName(data.name);
                        setSalonLogo(data.logo || null);
                    } else {
                        setSalonName("Bilinmeyen Salon");
                        setSalonLogo(null);
                    }
                } catch (error) {
                    console.error("Salon bilgisi çekilemedi:", error);
                    setSalonName("Hata");
                }
            } else if (!authLoading) {
                setSalonName("Salon Bulunamadı");
                setSalonLogo(null);
            }
        };

        if (!authLoading) {
            fetchSalonInfo();
        }
    }, [activeSalonId, authLoading]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-50 font-sans selection:bg-purple-500/30 overflow-hidden relative">
            {/* Global Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/40 border-r border-slate-800/50 flex flex-col backdrop-blur-2xl relative z-20">
                <div className="p-8 pb-6 flex items-center gap-4 text-blue-500 mb-2">
                    {salonLogo ? (
                        <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-0.5 border border-blue-500/20 shadow-lg shadow-blue-500/10 shrink-0">
                            <img src={salonLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        // Varsayılan Logo olarak Shield (3CSCORE) kullanıldı.
                        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 shrink-0">
                            <Shield size={28} strokeWidth={2} className="text-purple-400" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold tracking-tight text-white leading-none truncate" title={salonName}>{salonName}</h1>
                        <p className="text-[10px] text-purple-400/80 font-semibold tracking-widest mt-1 uppercase">Salon Paneli</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <div className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Yönetim</div>

                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('overview')}
                        className={`w-full justify-start gap-3 h-12 rounded-xl transition-all group ${activeTab === 'overview'
                            ? 'bg-blue-600/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'} />
                        <span className="font-medium tracking-wide">Genel Bakış</span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('players')}
                        className={`w-full justify-start gap-3 h-12 rounded-xl transition-all group ${activeTab === 'players'
                            ? 'bg-purple-600/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <Users size={18} className={activeTab === 'players' ? 'text-purple-400' : 'text-slate-500 group-hover:text-white'} />
                        <span className="font-medium tracking-wide">Oyuncular</span>
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('tournaments')}
                        className={`w-full justify-start gap-3 h-12 rounded-xl transition-all group ${activeTab === 'tournaments'
                            ? 'bg-amber-600/20 text-white border border-amber-500/30 shadow-lg shadow-amber-500/10'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <Trophy size={18} className={activeTab === 'tournaments' ? 'text-amber-400' : 'text-slate-500 group-hover:text-white'} />
                        <span className="font-medium tracking-wide">Turnuvalar</span>
                    </Button>
                </nav>

                <div className="p-6 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12 rounded-xl px-4"
                    >
                        <LogOut size={18} />
                        <span className="font-medium">Çıkış Yap</span>
                    </Button>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-slate-600">v1.0.0 • 3CSCORE Systems</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto relative p-8 scrollbar-hide">
                <div className="max-w-[1600px] mx-auto relative z-10">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">

                        {/* Tab Content: Genel Bakış */}
                        <TabsContent value="overview" className="space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        {/* YÖNETİCİ PROFİL RESMİ (BÜYÜTÜLDÜ) */}
                                        {userPhoto ? (
                                            <div className="relative group/avatar cursor-pointer">
                                                <img
                                                    src={userPhoto}
                                                    alt={userFullName}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shadow-xl group-hover/avatar:border-blue-500 transition-colors"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 shadow-xl">
                                                <UserCircle size={40} className="text-slate-400" />
                                            </div>
                                        )}
                                        {/* Hoş Geldiniz Kaldırıldı, Sadece İsim */}
                                        <h2 className="text-3xl font-bold text-white tracking-tight">
                                            {userFullName}
                                        </h2>
                                    </div>
                                    <p className="text-slate-400 text-base font-light ml-1">Salonunuzun anlık durumunu buradan takip edebilirsiniz.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500">Bugün</p>
                                    <p className="text-xl font-bold text-white">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="p-6 bg-slate-900/40 border-0 backdrop-blur-xl rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20" />
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors shadow-lg shadow-blue-500/10">
                                            <Users size={24} />
                                        </div>
                                        <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+0%</span>
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <h3 className="text-3xl font-bold text-white">-</h3>
                                        <p className="text-sm text-slate-400 font-medium">Toplam Oyuncu</p>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-slate-900/40 border-0 backdrop-blur-xl rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-amber-500/20" />
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-lg shadow-amber-500/10">
                                            <Trophy size={24} />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded-full">Aktif</span>
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <h3 className="text-3xl font-bold text-white">0</h3>
                                        <p className="text-sm text-slate-400 font-medium">Devam Eden Turnuva</p>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-slate-900/40 border-0 backdrop-blur-xl rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20" />
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors shadow-lg shadow-purple-500/10">
                                            <Target size={24} />
                                        </div>
                                        <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+0%</span>
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <h3 className="text-3xl font-bold text-white">0</h3>
                                        <p className="text-sm text-slate-400 font-medium">Bugünkü Maçlar</p>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-slate-900/40 border-0 backdrop-blur-xl rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-emerald-500/20" />
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-lg shadow-emerald-500/10">
                                            <Activity size={24} />
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Online</span>
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <h3 className="text-3xl font-bold text-white">0%</h3>
                                        <p className="text-sm text-slate-400 font-medium">Masa Doluluk</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Recent Activity & Charts Placeholder */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-md min-h-[300px]">
                                    <h3 className="text-lg font-bold text-white mb-4">Aylık Aktivite</h3>
                                    <div className="h-full flex items-center justify-center text-slate-600">
                                        Grafik Alanı (Geliştirilecek)
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-md">
                                    <h3 className="text-lg font-bold text-white mb-4">Son İşlemler</h3>
                                    <div className="text-center text-slate-500 text-sm py-8">Henüz işlem yok</div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab Content: Oyuncular */}
                        <TabsContent value="players" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Propu activeSalonId olarak geçiriyoruz */}
                            <PlayersPage forcedSalonId={activeSalonId} />
                        </TabsContent>

                        {/* Tab Content: Turnuvalar */}
                        <TabsContent value="tournaments" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-center h-[500px] border border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
                                <div className="text-center">
                                    <Trophy size={48} className="mx-auto text-slate-700 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Turnuva Modülü</h3>
                                    <p className="text-slate-500">Bu özellik yakında aktif olacak.</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

        </div>
    );
}
