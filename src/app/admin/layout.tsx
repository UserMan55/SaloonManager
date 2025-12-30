'use client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0f172a]">
            {children}
        </div>
    );
}
