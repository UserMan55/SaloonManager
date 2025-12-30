'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Shield, Building2, LayoutDashboard, Settings, LogOut, Plus, Search, Trash2, Edit2, CheckCircle, XCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function SuperAdminPage() {
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();

    // AUTH GUARD: Sadece Super Admin girebilir
    useEffect(() => {
        if (!authLoading) {
            if (!user || role !== 'super_admin') {
                router.push('/');
            }
        }
    }, [user, role, authLoading, router]);

    // State
    const [salons, setSalons] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSalon, setSelectedSalon] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Form State
    const [formName, setFormName] = useState('');
    const [formCity, setFormCity] = useState(''); // Şehir State
    const [formLogo, setFormLogo] = useState(''); // Logo State
    const [formStatus, setFormStatus] = useState('active');

    // Çoklu Yönetici State'i
    const [formAdmins, setFormAdmins] = useState<{ email: string; phone: string; name: string }[]>([
        { email: '', phone: '', name: '' }
    ]);

    // Dışarı tıklandığında menüyü kapatmak için basit bir çözüm (isteğe bağlı ama UX için iyi)
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [openMenuId]);

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Card click event'ini engelle
        setOpenMenuId(openMenuId === id ? null : id);
    };

    // Yönetici Ekle/Çıkar Fonksiyonları
    const addAdminField = () => {
        setFormAdmins([...formAdmins, { email: '', phone: '', name: '' }]);
    };

    const removeAdminField = (index: number) => {
        if (formAdmins.length > 1) {
            const newAdmins = [...formAdmins];
            newAdmins.splice(index, 1);
            setFormAdmins(newAdmins);
        }
    };

    const updateAdminField = (index: number, field: 'email' | 'phone' | 'name', value: string) => {
        const newAdmins = [...formAdmins];
        newAdmins[index][field] = value;
        setFormAdmins(newAdmins);
    };

    // Salonları Çek
    useEffect(() => {
        const q = query(collection(db, 'salons'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const salonData: any[] = [];
            snapshot.forEach((doc) => {
                salonData.push({ id: doc.id, ...doc.data() });
            });
            setSalons(salonData);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, 'salons'), {
                name: formName,
                city: formCity.toLocaleUpperCase('tr-TR'), // Şehri büyük harfle kaydet
                logo: formLogo,
                admins: formAdmins, // Artık array olarak kaydediyoruz
                status: 'active',
                createdAt: serverTimestamp(),
                subscriptionPlan: 'pro'
            });
            setIsCreateModalOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            alert("Salon oluşturulurken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSalon) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'salons', selectedSalon.id), {
                name: formName,
                city: formCity.toLocaleUpperCase('tr-TR'), // Şehri güncelle
                logo: formLogo,
                admins: formAdmins,
                status: formStatus
            });
            setIsEditModalOpen(false);
            setSelectedSalon(null);
            resetForm();
        } catch (error) {
            console.error(error);
            alert("Güncelleme hatası.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSalon = async (id: string) => {
        if (confirm('Bu salonu ve AİT TÜM VERİLERİ silmek üzeresiniz. Emin misiniz?')) {
            try {
                await deleteDoc(doc(db, 'salons', id));
            } catch (e) {
                console.error(e);
                alert("Silme hatası");
            }
        }
    };

    const openEditModal = (salon: any) => {
        setSelectedSalon(salon);
        setFormName(salon.name);
        setFormCity(salon.city || ''); // Şehir bilgisini form'a yükle
        setFormLogo(salon.logo || '');

        // Veri doğrulama ve dönüştürme
        let cleanAdmins: { email: string; phone: string; name: string }[] = [];

        if (salon.admins && Array.isArray(salon.admins)) {
            cleanAdmins = salon.admins.map((admin: any) => {
                if (typeof admin === 'string') {
                    // Eğer string ise (muhtemelen UID veya email), obje yapısına çevir
                    return { email: admin.includes('@') ? admin : '', phone: '', name: admin };
                } else if (typeof admin === 'object' && admin !== null) {
                    // Zaten obje ise, eksik alanları tamamla
                    return {
                        email: admin.email || '',
                        phone: admin.phone || '',
                        name: admin.name || ''
                    };
                }
                return { email: '', phone: '', name: '' };
            });
        }

        // Eğer admins boş geldiyse ama adminEmail varsa (eski kayıt)
        if (cleanAdmins.length === 0 && salon.adminEmail) {
            cleanAdmins.push({ email: salon.adminEmail, phone: '', name: 'Yönetici' });
        }

        // Hiçbiri yoksa boş bir alan aç
        if (cleanAdmins.length === 0) {
            cleanAdmins.push({ email: '', phone: '', name: '' });
        }

        setFormAdmins(cleanAdmins);
        setFormStatus(salon.status || 'active');
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormName('');
        setFormCity('');
        setFormLogo('');
        setFormAdmins([{ email: '', phone: '', name: '' }]);
        setFormStatus('active');
    };

    const filteredSalons = salons.filter(s => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const nameMatch = (s.name || '').toLowerCase().includes(lowerCaseSearchTerm);
        const adminMatch = s.admins?.some((admin: any) =>
            (admin.email || '').toLowerCase().includes(lowerCaseSearchTerm) ||
            (admin.name || '').toLowerCase().includes(lowerCaseSearchTerm) ||
            (admin.phone || '').toLowerCase().includes(lowerCaseSearchTerm)
        ) || (s.adminEmail && s.adminEmail.toLowerCase().includes(lowerCaseSearchTerm)); // Backward compatibility
        return nameMatch || adminMatch;
    });

    return (
        <div className="flex h-screen bg-[#020617] text-slate-50 font-sans selection:bg-purple-500/30 overflow-hidden relative">
            {/* Global Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />

            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/40 border-r border-slate-800/50 flex flex-col backdrop-blur-2xl relative z-20">
                <div className="p-8 pb-6 flex items-center gap-4 text-purple-500 mb-2">
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
                        <Shield size={28} strokeWidth={2} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white leading-none">3CSCORE</h1>
                        <p className="text-[10px] text-purple-400/80 font-semibold tracking-widest mt-1 uppercase">Super Admin</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <div className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Menü</div>
                    <Button variant="ghost" className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 text-white shadow-lg border border-white/5 h-12 rounded-xl transition-all group">
                        <Building2 size={18} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
                        <span className="font-medium tracking-wide">Salon Yönetimi</span>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-white/5 h-12 rounded-xl transition-all">
                        <Settings size={18} />
                        <span className="font-medium tracking-wide">Sistem Ayarları</span>
                    </Button>
                </nav>

                <div className="p-6 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
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

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative p-8 scrollbar-hide">
                <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
                    {/* Header Section */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Salonlar</h1>
                            <p className="text-slate-400 text-base font-light">Sistemdeki tüm işletmelerin anlık durumu ve yönetimi.</p>
                        </div>
                        <Button
                            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                            className="h-12 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl shadow-xl shadow-purple-500/20 border-0 transition-all active:scale-95"
                        >
                            <Plus size={20} className="mr-2" />
                            Yeni Salon Ekle
                        </Button>
                    </div>

                    {/* Filter & Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="md:col-span-3 border-0 bg-slate-900/40 backdrop-blur-md p-1.5 rounded-2xl flex items-center shadow-lg">
                            <Search className="ml-4 text-slate-500" size={20} />
                            <Input
                                placeholder="Salon adı, yetkili e-postası veya telefon numarası ile detaylı arama..."
                                className="border-0 bg-transparent h-12 text-base placeholder:text-slate-600 focus-visible:ring-0"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </Card>
                        <Card className="border-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center gap-3 rounded-2xl shadow-lg">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-slate-300 font-medium">{filteredSalons.filter(s => s.status === 'active').length} Aktif Salon</span>
                        </Card>
                    </div>

                    {/* Salon Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filteredSalons.map((salon) => (
                            <Card key={salon.id} className="group border-0 bg-slate-900/40 hover:bg-slate-800/50 backdrop-blur-md transition-all duration-300 overflow-visible rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 relative">
                                {/* Top Gradient Border */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r rounded-t-3xl ${salon.status === 'active' ? 'from-green-500 to-emerald-400' : 'from-red-500 to-orange-500'}`} />

                                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6 relative">
                                    <div className="flex items-center gap-4">
                                        {salon.logo ? (
                                            <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden flex items-center justify-center p-0.5 border border-slate-700 shadow-lg shadow-purple-500/10">
                                                <img src={salon.logo} alt="Logo" className="w-full h-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-inner ${salon.status === 'active' ? 'bg-gradient-to-br from-purple-600 to-blue-600 shadow-purple-500/20' : 'bg-slate-700'
                                                }`}>
                                                {salon.name.substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight truncate max-w-[150px]">{salon.name}</h3>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 mb-1">
                                                <MapPin size={10} /> {salon.city || 'Belirtilmemiş'}
                                            </div>
                                            <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${salon.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {salon.status === 'active' ? '● Aktif' : '○ Pasif'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Settings Menu Trigger */}
                                    <div className="relative">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10 rounded-full" onClick={(e) => toggleMenu(e, salon.id)}>
                                            <Settings size={18} />
                                        </Button>

                                        {/* Dropdown Menu */}
                                        {openMenuId === salon.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-blue-400 hover:bg-white/5 hover:text-blue-300 flex items-center gap-2 transition-colors border-b border-slate-700/50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.location.href = `/admin/dashboard?salonId=${salon.id}`;
                                                    }}
                                                >
                                                    <LayoutDashboard size={14} /> Yönetim Paneline Git
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(salon);
                                                        setOpenMenuId(null);
                                                    }}
                                                >
                                                    <Edit2 size={14} /> Düzenle
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors border-t border-slate-700/50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSalon(salon.id);
                                                        setOpenMenuId(null);
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Sil
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="px-6 pb-6 pt-2 space-y-4">
                                    {/* Admins List */}
                                    <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yetkililer</span>
                                            <span className="bg-white/5 text-slate-400 hover:bg-white/10 text-[10px] h-5 px-2 py-0.5 rounded-full">{salon.admins ? salon.admins.length : 0}</span>
                                        </div>

                                        <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 custom-scrollbar">
                                            {salon.admins && salon.admins.length > 0 ? (
                                                salon.admins.map((admin: any, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-3 group/admin">
                                                        <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 border border-slate-700 shrink-0">
                                                            {admin.name ? admin.name.substring(0, 1).toUpperCase() : '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm text-slate-200 font-medium truncate">{admin.name}</div>
                                                            <div className="text-[10px] text-slate-500 truncate">{admin.phone}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-slate-600 italic">Yetkili yok</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional Info / Footer Removed */}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>

            {/* MODALS - Minimal Design Update */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="bg-slate-900/95 border-slate-800 backdrop-blur-xl max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white">Yeni Salon Ekle</DialogTitle>
                        <DialogDescription className="text-slate-400">Şube ve yönetici bilgilerini giriniz.</DialogDescription>
                    </DialogHeader>
                    {/* ... Form yapısı aynı kalacak, sadece stiller güncellendi ... */}
                    <form onSubmit={handleCreateSalon} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Salon Adı</Label>
                            <Input value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Örn: Elit Bilardo" className="bg-black/40 border-slate-700 h-11 focus:ring-purple-500" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Şehir</Label>
                            <Input
                                value={formCity}
                                onChange={(e) => setFormCity(e.target.value)}
                                placeholder="Örn: SAMSUN"
                                className="bg-black/40 border-slate-700 h-11 focus:ring-purple-500 uppercase placeholder:normal-case"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Logo Linki (Opsiyonel)</Label>
                            <Input value={formLogo} onChange={e => setFormLogo(e.target.value)} placeholder="https://..." className="bg-black/40 border-slate-700 h-11 focus:ring-purple-500" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-purple-400 text-sm uppercase tracking-wide font-bold">Yöneticiler</Label>
                                <Button type="button" variant="secondary" size="sm" onClick={addAdminField} className="h-7 text-xs bg-slate-800 text-slate-300 hover:text-white">
                                    <Plus size={12} className="mr-1" /> Kişi Ekle
                                </Button>
                            </div>

                            {formAdmins.map((admin, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl bg-black/20 border border-slate-800/60 relative group transition-all hover:bg-black/40">
                                    <div className="md:col-span-4 space-y-1">
                                        <Label className="text-[10px] text-slate-500 uppercase">Ad Soyad</Label>
                                        <Input value={admin.name} onChange={(e) => updateAdminField(index, 'name', e.target.value)} required className="h-9 bg-transparent border-slate-700/50" placeholder="İsim" />
                                    </div>
                                    <div className="md:col-span-4 space-y-1">
                                        <Label className="text-[10px] text-slate-500 uppercase">Telefon</Label>
                                        <Input type="tel" value={admin.phone} onChange={(e) => updateAdminField(index, 'phone', e.target.value)} required className="h-9 bg-transparent border-slate-700/50" placeholder="5XX..." />
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <Label className="text-[10px] text-slate-500 uppercase">E-Posta</Label>
                                        <Input type="email" value={admin.email} onChange={(e) => updateAdminField(index, 'email', e.target.value)} required className="h-9 bg-transparent border-slate-700/50" placeholder="@mail" />
                                    </div>

                                    {formAdmins.length > 1 && (
                                        <div className="md:col-span-1 flex items-end justify-center pb-1">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAdminField(index)} className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-full">
                                                <XCircle size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">İptal</Button>
                            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                                {loading ? 'Kaydediliyor...' : 'Salonu Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL - Benzer stil updates */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="bg-slate-900/95 border-slate-800 backdrop-blur-xl max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-white">Salonu Düzenle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateSalon} className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Salon Adı</Label>
                            <Input value={formName} onChange={e => setFormName(e.target.value)} required className="bg-black/40 border-slate-700 h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Şehir</Label>
                            <Input
                                value={formCity}
                                onChange={(e) => setFormCity(e.target.value)}
                                placeholder="Örn: SAMSUN"
                                className="bg-black/40 border-slate-700 h-11 uppercase placeholder:normal-case"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Logo Linki (Opsiyonel)</Label>
                            <Input value={formLogo} onChange={e => setFormLogo(e.target.value)} placeholder="https://..." className="bg-black/40 border-slate-700 h-11" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-purple-400 text-sm uppercase tracking-wide font-bold">Yöneticiler</Label>
                                <Button type="button" variant="secondary" size="sm" onClick={addAdminField} className="h-7 text-xs bg-slate-800 text-slate-300 hover:text-white">
                                    <Plus size={12} className="mr-1" /> Kişi Ekle
                                </Button>
                            </div>

                            {formAdmins.map((admin, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl bg-black/20 border border-slate-800/60 relative group transition-all hover:bg-black/40">
                                    <div className="md:col-span-4 space-y-1">
                                        <Label className="text-[10px] text-slate-500 uppercase">Ad Soyad</Label>
                                        <Input value={admin.name} onChange={(e) => updateAdminField(index, 'name', e.target.value)} required className="h-9 bg-transparent border-slate-700/50" />
                                    </div>
                                    <div className="md:col-span-4 space-y-1">
                                        <Label className="text-[10px] text-slate-500 uppercase">Telefon</Label>
                                        <Input type="tel" value={admin.phone} onChange={(e) => updateAdminField(index, 'phone', e.target.value)} required className="h-9 bg-transparent border-slate-700/50" />
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <Label className="text-[10px] text-slate-500 uppercase">E-Posta</Label>
                                        <Input type="email" value={admin.email} onChange={(e) => updateAdminField(index, 'email', e.target.value)} required className="h-9 bg-transparent border-slate-700/50" />
                                    </div>
                                    {formAdmins.length > 1 && (
                                        <div className="md:col-span-1 flex items-end justify-center pb-1">
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeAdminField(index)} className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-full">
                                                <XCircle size={16} />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                            <Label className="text-slate-400">Salon Durumu</Label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                                    <input type="radio" name="status" value="active" checked={formStatus === 'active'} onChange={() => setFormStatus('active')} className="w-4 h-4 text-green-500 accent-green-500" />
                                    <span className="text-white text-sm font-medium">Aktif</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                                    <input type="radio" name="status" value="passive" checked={formStatus === 'passive'} onChange={() => setFormStatus('passive')} className="w-4 h-4 text-red-500 accent-red-500" />
                                    <span className="text-white text-sm font-medium">Pasif</span>
                                </label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="text-slate-400">İptal</Button>
                            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white">
                                {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
