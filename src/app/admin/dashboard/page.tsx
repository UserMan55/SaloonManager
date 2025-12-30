'use client';

import { useState, useEffect, Suspense } from 'react';
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
    Shield,
    Grid,
    Menu // Added Menu Icon
} from 'lucide-react';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Added Sheet

// Sub-page Import
import PlayersPage from '../players/page';
import TablesPage from '../tables/page';
import TournamentsPage from '../tournaments/page';

function DashboardContent() {
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

    // Helper to render Sidebar Content (Reused for Desktop & Mobile)
    // Defined INSIDE component to access state like setActiveTab, salonName, etc.
    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white/90 backdrop-blur-2xl">
            <div className="p-8 pb-6 flex items-center gap-4 text-blue-600 mb-2">
                <div className="w-12 h-12 rounded-full bg-white overflow-hidden flex items-center justify-center border border-slate-200 shadow-lg shadow-blue-500/10 shrink-0">
                    <img src="/logo.png" alt="3CSCORE" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none truncate" title={salonName}>{salonName}</h1>
                    <p className="text-[10px] text-blue-500 font-semibold tracking-widest mt-1 uppercase">Salon Paneli</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                <div className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Yönetim</div>

                <Button
                    variant="ghost"
                    onClick={() => setActiveTab('overview')}
                    className={`w-full justify-start gap-3 h-12 rounded-xl transition-all group ${activeTab === 'overview'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                        }`}
                >
                    <Activity size={18} className={activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span className="font-medium tracking-wide">Genel Bakış</span>
                </Button>

                <Button
                    variant="ghost"
                    onClick={() => setActiveTab('tables')}
                    className={`w-full justify-start gap-3 h-12 rounded-xl transition-all group ${activeTab === 'tables'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                        }`}
                >
                    <Grid size={18} className={activeTab === 'tables' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span className="font-medium tracking-wide">Masalar</span>
                </Button>

                <Button
                    variant="ghost"
                    onClick={() => setActiveTab('players')}
                    className={`w-full justify-start gap-3 h-12 rounded-xl transition-all group ${activeTab === 'players'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                        }`}
                >
                    <UserCircle size={18} className={activeTab === 'players' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span className="font-medium tracking-wide">Oyuncular</span>
                </Button>

                <Button
                    variant="ghost"
                    onClick={() => setActiveTab('tournaments')}
                    className={`w-full justify-start gap-3 h-12 rounded-xl transition-all group ${activeTab === 'tournaments'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                        }`}
                >
                    <Target size={18} className={activeTab === 'tournaments' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                    <span className="font-medium tracking-wide">Turnuvalar</span>
                </Button>
            </nav>

            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />
                    <span className="font-medium">Oturumu Kapat</span>
                </Button>
                <div className="mt-4 text-center">
                    <p className="text-[10px] text-slate-600">v1.0.0 • 3CSCORE Systems</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#020617] text-slate-50 font-sans selection:bg-purple-500/30 overflow-hidden relative">
            {/* Global Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-600/10 rounded-full blur-[128px] pointer-events-none" />

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-72 bg-white/90 border-r border-slate-200 flex-col backdrop-blur-2xl relative z-20 shadow-2xl shadow-blue-900/5">
                <SidebarContent />
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">

                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white/95 border-b border-slate-200 backdrop-blur-xl z-30">
                    <div className="flex items-center gap-3">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-600">
                                    <Menu size={24} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 bg-transparent border-0 shadow-none">
                                <div className="h-full w-full rounded-r-3xl overflow-hidden bg-white">
                                    <SidebarContent />
                                </div>
                            </SheetContent>
                        </Sheet>
                        <h1 className="text-lg font-bold text-slate-900 truncate max-w-[200px]">{salonName}</h1>
                    </div>
                    {/* Mobile User Avatar (Mini) */}
                    {userPhoto && (
                        <img src={userPhoto} alt="User" className="w-8 h-8 rounded-full border border-slate-300" />
                    )}
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto p-4 md:p-8 scrollbar-hide">
                    <div className="max-w-[1600px] mx-auto">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">

                            {/* Tab Content: Genel Bakış */}
                            <TabsContent value="overview" className="space-y-6 md:space-y-8 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            {/* YÖNETİCİ PROFİL RESMİ */}
                                            {userPhoto ? (
                                                <div className="relative group/avatar cursor-pointer">
                                                    <img
                                                        src={userPhoto}
                                                        alt={userFullName}
                                                        className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-slate-700 shadow-xl group-hover/avatar:border-sky-500 transition-colors"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 shadow-xl">
                                                    <UserCircle size={32} className="md:w-10 md:h-10 text-slate-400" />
                                                </div>
                                            )}
                                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                                {userFullName}
                                            </h2>
                                        </div>
                                        <p className="text-slate-400 text-sm md:text-base font-light ml-1">Salonunuzun anlık durumunu buradan takip edebilirsiniz.</p>
                                    </div>
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm text-slate-500">Bugün</p>
                                        <p className="text-xl font-bold text-white">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p>
                                    </div>
                                </div>

                                {/* Stats Grid - UNIFIED PREMIUM DESIGN */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                    {/* Total Players */}
                                    <Card className="p-6 bg-[#1e293b]/50 border border-white/5 backdrop-blur-md rounded-3xl relative overflow-hidden group hover:border-sky-500/30 transition-all duration-300 shadow-xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-sky-500/10" />
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors shadow-lg shadow-sky-500/10">
                                                <Users size={24} />
                                            </div>
                                            <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+0%</span>
                                        </div>
                                        <div className="space-y-1 relative z-10">
                                            <h3 className="text-3xl font-bold text-white">-</h3>
                                            <p className="text-sm text-slate-400 font-medium">Toplam Oyuncu</p>
                                        </div>
                                    </Card>

                                    {/* Active Tournaments */}
                                    <Card className="p-6 bg-[#1e293b]/50 border border-white/5 backdrop-blur-md rounded-3xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300 shadow-xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-amber-500/10" />
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

                                    {/* Today's Matches */}
                                    <Card className="p-6 bg-[#1e293b]/50 border border-white/5 backdrop-blur-md rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 shadow-xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-indigo-500/10" />
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-lg shadow-indigo-500/10">
                                                <Target size={24} />
                                            </div>
                                            <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">+0%</span>
                                        </div>
                                        <div className="space-y-1 relative z-10">
                                            <h3 className="text-3xl font-bold text-white">0</h3>
                                            <p className="text-sm text-slate-400 font-medium">Bugünkü Maçlar</p>
                                        </div>
                                    </Card>

                                    {/* Table Occupancy */}
                                    <Card className="p-6 bg-[#1e293b]/50 border border-white/5 backdrop-blur-md rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] -mr-16 -mt-16 transition-all group-hover:bg-emerald-500/10" />
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

                            {/* Tab Content: Masalar */}
                            <TabsContent value="tables" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <TablesPage forcedSalonId={activeSalonId} />
                            </TabsContent>

                            {/* Tab Content: Turnuvalar */}
                            <TabsContent value="tournaments" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <TournamentsPage forcedSalonId={activeSalonId} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#020617] text-white">Yükleniyor...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

