'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Users, Trophy, LayoutDashboard, Settings, Swords } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Genel Bakış', href: '/portal/admin/dashboard' },
        // Removed Table View as requested for now
        { icon: Trophy, label: 'Turnuvalar', href: '/portal/admin/tournaments' },
        { icon: Users, label: 'Oyuncular', href: '/portal/admin/players' },
        { icon: Settings, label: 'Ayarlar', href: '/portal/admin/settings' },
    ];

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-blue-500/30">
            {/* Sidebar - Updated to matches Dark Theme */}
            <aside className="w-72 bg-[#1e293b]/50 border-r border-slate-800 flex flex-col backdrop-blur-xl">
                <div className="p-8">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                        <Swords size={28} strokeWidth={2.5} />
                        <h1 className="text-2xl font-bold tracking-tight text-white">3CSCORE</h1>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 tracking-wider pl-9">SALON PANELİ</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
                                <span className="font-medium text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <div className="px-4 py-4 bg-slate-800/50 rounded-xl mb-4 border border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-2 font-medium">Salon Puanı</p>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full w-[75%]"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Standart</span>
                            <span>Pro</span>
                        </div>
                    </div>
                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 w-full rounded-xl transition-colors text-sm font-medium">
                        <LogOut size={18} />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-[#0f172a] relative">
                {/* Background Glow Effect */}
                <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/5 blur-[120px] pointer-events-none"></div>

                <div className="p-8 lg:p-12 max-w-7xl mx-auto relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
