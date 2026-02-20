"use client";

import React, { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Settings2, 
  LogOut, 
  Store, 
  Menu, 
  X,
  User,
  Copy,
  ExternalLink,
  Check,
  Users,
  Sparkles
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [slug, setSlug] = useState("");
    const [copied, setCopied] = useState(false);
    
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkUserAndCompany = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
            } else {
                setUserEmail(user.email || "");
                // Busca o slug da empresa para montar os links
                const { data } = await supabase.from("Company").select("slug").eq("owner_id", user.id).single();
                if (data) setSlug(data.slug);
            }
        };
        checkUserAndCompany();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/${slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Atualizado: O path do Kanban usa o slug carregado no estado. 
    // O target="_blank" será aplicado ali embaixo no map.
    const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard", isExternal: false },
    { name: "Painel Operacional", icon: ShoppingBag, path: slug ? `/kanban/${slug}` : "#", isExternal: true },
    { name: "Catálogo", icon: Package, path: "/admin/products", isExternal: false },
    { name: "Clientes", icon: Users, path: "/admin/customers", isExternal: false }, // <-- AQUI A TELA NOVA
    { name: "Integrações", icon: Sparkles, path: "/admin/integrations", isExternal: false },
    { name: "Configurações", icon: Settings2, path: "/admin/settings", isExternal: false },
];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* SIDEBAR */}
            <aside className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-20`}>
                <div className="p-6 flex items-center gap-3 text-blue-600 font-bold text-xl overflow-hidden shrink-0">
                    <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    {isSidebarOpen && <span className="whitespace-nowrap">ZapFlow</span>}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                target={item.isExternal ? "_blank" : "_self"}
                                rel={item.isExternal ? "noopener noreferrer" : ""}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                                    isActive 
                                    ? "bg-blue-50 text-blue-600 font-semibold" 
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                <item.icon className="w-5 h-5 shrink-0" />
                                {isSidebarOpen && (
                                    <div className="flex items-center justify-between w-full">
                                        <span>{item.name}</span>
                                        {item.isExternal && <ExternalLink className="w-3.5 h-3.5 opacity-50" />}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* BOTÃO DE LINK PÚBLICO */}
                {isSidebarOpen && slug && (
                    <div className="px-4 pb-4 shrink-0">
                        <div className="bg-blue-600 rounded-2xl p-4 text-white space-y-3 shadow-lg shadow-blue-600/30">
                            <p className="text-xs font-bold uppercase opacity-80">Link da sua Loja</p>
                            <div className="bg-white/10 rounded-lg p-2 flex items-center justify-between gap-2 overflow-hidden">
                                <span className="text-xs truncate opacity-90">{`/${slug}`}</span>
                                <button 
                                    onClick={handleCopyLink}
                                    className="bg-white text-blue-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors shrink-0"
                                    title="Copiar Link"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <Link 
                                href={`/${slug}`} 
                                target="_blank"
                                className="flex items-center justify-center gap-2 text-xs font-bold bg-white/20 hover:bg-white/30 py-2 rounded-lg transition-all"
                            >
                                Ver Cardápio <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-gray-100 shrink-0">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {isSidebarOpen && <span>Sair</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* HEADER */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">Admin Adega</p>
                            <p className="text-xs text-gray-500">{userEmail}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <section className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {children}
                </section>
            </main>
        </div>
    );
}