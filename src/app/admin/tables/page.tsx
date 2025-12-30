'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Monitor, AlertCircle, CheckCircle, XCircle, Grid, List } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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

interface Table {
    id: string;
    tableNumber: string;
    isEmpty: boolean;
    isIntegrated3Cscore: boolean;
    salonId: string;
}

interface TablesPageProps {
    forcedSalonId?: string | null;
}

export default function TablesPage({ forcedSalonId }: TablesPageProps) {
    const { salonId: authSalonId } = useAuth();
    const salonId = forcedSalonId || authSalonId;

    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<Table | null>(null); // Düzenlenen masa state

    // Form State
    const [tableNumber, setTableNumber] = useState('');
    const [isIntegrated, setIsIntegrated] = useState(false);

    // Fetch Tables
    useEffect(() => {
        if (!salonId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'tables'),
            where('salonId', '==', salonId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tableData: Table[] = [];
            snapshot.forEach((doc) => {
                tableData.push({ id: doc.id, ...doc.data() } as Table);
            });
            // Sort by table number (numeric sort if possible)
            tableData.sort((a, b) => {
                const numA = parseInt(a.tableNumber.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.tableNumber.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
            setTables(tableData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [salonId]);

    const handleAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!salonId) return;

        try {
            if (editingTable) {
                // GÜNCELLEME MODU
                await updateDoc(doc(db, 'tables', editingTable.id), {
                    tableNumber,
                    isIntegrated3Cscore: isIntegrated
                });
            } else {
                // EKLEME MODU
                await addDoc(collection(db, 'tables'), {
                    tableNumber,
                    isEmpty: true, // Default to empty
                    isIntegrated3Cscore: isIntegrated,
                    salonId: salonId,
                    createdAt: serverTimestamp(),
                });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving table: ", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu masayı silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, 'tables', id));
        }
    };

    const toggleTableStatus = async (table: Table) => {
        try {
            await updateDoc(doc(db, 'tables', table.id), {
                isEmpty: !table.isEmpty
            });
        } catch (error) {
            console.error("Status update error:", error);
        }
    };

    const openEditModal = (table: Table) => {
        setEditingTable(table);
        setTableNumber(table.tableNumber);
        setIsIntegrated(table.isIntegrated3Cscore);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingTable(null);
        setTableNumber('');
        setIsIntegrated(false);
    };

    if (!salonId && !loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <AlertCircle size={48} className="mb-4 text-orange-500" />
                <h3 className="text-xl font-bold text-white mb-2">Salon Bulunamadı</h3>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Masa Yönetimi</h1>
                    <p className="text-slate-400 text-sm">
                        Salonunuzdaki {tables.length} masa listeleniyor.
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 border-0">
                            <Plus size={18} />
                            Yeni Masa Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-slate-900/95 border-slate-800 backdrop-blur-xl text-white">
                        <DialogHeader>
                            <DialogTitle>{editingTable ? 'Masayı Düzenle' : 'Yeni Masa Ekle'}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Masa numarası ve entegrasyon durumunu {editingTable ? 'güncelleyin' : 'belirleyin'}.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAddTable} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="tableNumber" className="text-slate-300">Masa No / Adı</Label>
                                <Input
                                    id="tableNumber"
                                    placeholder="örn. 1, Masa A"
                                    value={tableNumber}
                                    onChange={e => setTableNumber(e.target.value)}
                                    required
                                    className="bg-black/40 border-slate-700"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-slate-200">3CSCORE Entegrasyonu</Label>
                                    <p className="text-xs text-slate-500">Bu masa akıllı skorboard sistemine bağlı mı?</p>
                                </div>
                                <Switch
                                    checked={isIntegrated}
                                    onCheckedChange={setIsIntegrated}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    {editingTable ? 'Değişiklikleri Kaydet' : 'Masayı Kaydet'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tables Grid */}
            {loading ? (
                <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Masalar yükleniyor...</p>
                </div>
            ) : tables.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/50">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Grid size={32} className="text-slate-600" />
                    </div>
                    <p className="text-white font-medium mb-1">Henüz masa eklenmemiş</p>
                    <p className="text-slate-500 text-sm">İlk masanızı ekleyerek başlayın.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tables.map((table) => (
                        <Card key={table.id} className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden group hover:border-slate-700 transition-all hover:-translate-y-1">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-auto min-w-[3rem] px-4 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-lg font-bold text-white shadow-inner">
                                        {table.tableNumber}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${table.isEmpty
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        }`}>
                                        {table.isEmpty ? 'Boş' : 'Dolu'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Monitor size={16} className={table.isIntegrated3Cscore ? 'text-blue-400' : 'text-slate-600'} />
                                        <span>
                                            {table.isIntegrated3Cscore ? '3CSCORE Aktif' : 'Manuel Masa'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="secondary"
                                            className={`flex-1 h-9 text-xs ${table.isEmpty ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                            onClick={() => toggleTableStatus(table)}
                                        >
                                            {table.isEmpty ? 'Oyunu Başlat' : 'Masayı Boşalt'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-slate-500 hover:text-white hover:bg-white/10"
                                            onClick={() => openEditModal(table)}
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={() => handleDelete(table.id)}
                                        >
                                            <Trash2 size={16} />
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
