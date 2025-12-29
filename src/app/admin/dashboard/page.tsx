'use client';

import { Users, Trophy, LayoutDashboard, Settings } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="text-white min-h-screen">
            {/* Header with Welcome & Status */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Hoş Geldin, Salon Müdürü
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Salonunuzdaki aktiviteleri buradan yönetebilirsiniz.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Active Tournament Badge Placeholder */}
                    <div className="bg-slate-800 border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-300">Sistem Aktif</span>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { icon: Users, label: "Toplam Oyuncu", value: "124", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
                    { icon: Trophy, label: "Aktif Turnuva", value: "1", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
                    { icon: LayoutDashboard, label: "Müsait Masa", value: "6/8", color: "bg-green-500/10 text-green-500 border-green-500/20" },
                    { icon: Settings, label: "Bekleyen Maç", value: "3", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
                ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${stat.color} backdrop-blur-sm`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.color.split(' ')[0]}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-3xl font-bold text-white">{stat.value}</span>
                        </div>
                        <h3 className="text-sm font-medium opacity-80">{stat.label}</h3>
                    </div>
                ))}
            </div>

            {/* Content Area - Placeholder for future widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Hızlı Erişim</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-left group">
                                <span className="block font-semibold mb-1">Yeni Turnuva Oluştur</span>
                                <span className="text-sm text-blue-200 group-hover:text-white">Sihirbazı Başlat &rarr;</span>
                            </button>
                            <button className="p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors text-left group">
                                <span className="block font-semibold mb-1">Oyuncu Kaydet</span>
                                <span className="text-sm text-slate-400 group-hover:text-white">CRM'e Ekle &rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column (Waiting List / Activity) */}
                <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Son Aktiviteler</h2>
                            <span className="text-xs text-slate-500">Bugün</span>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 items-start p-3 hover:bg-slate-700/30 rounded-lg transition-colors cursor-default">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">Ahmet Y. vs Mehmet K. maçı bitti.</p>
                                        <p className="text-xs text-slate-500 mt-1">12:30 - Masa 1</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
