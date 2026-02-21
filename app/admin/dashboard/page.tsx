"use client";

import React, { useState, useEffect } from "react";
import { 
    TrendingUp, 
    ShoppingCart, 
    Users, 
    DollarSign, 
    ArrowUpRight, 
    Loader2,
    LucideIcon,
    Eye,
    EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Pedido {
    id: string;
    cliente: string;
    valor: number;
    status: string;
}

interface DashboardData {
    vendasHoje: number;
    pedidosHoje: number;
    novosClientes: number;
    conversao: number;
    ultimosPedidos: Pedido[];
}

interface StatItem {
    label: string;
    value: number | string;
    type: "currency" | "number" | "percentage";
    icon: LucideIcon;
    color: string;
    trend: string;
}

export default function DashboardPage() {
    const [dados, setDados] = useState<DashboardData>({
        vendasHoje: 0,
        pedidosHoje: 0,
        novosClientes: 0,
        conversao: 0,
        ultimosPedidos: []
    });
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [erro, setErro] = useState<string | null>(null);
    
    // FUNÇÃO DE ESCONDER VALORES (Padrão: true para esconder)
    const [hideValues, setHideValues] = useState<boolean>(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { data: company } = await supabase
                .from("Company")
                .select("id")
                .eq("owner_id", user.id)
                .single();

            if (!company) throw new Error("Empresa não encontrada");

            const response = await fetch(`/api/dashboard?companyId=${company.id}`);
            if (!response.ok) throw new Error('Erro ao buscar dados');

            const data: DashboardData = await response.json();
            setDados(data);
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDisplay = (val: number | string, type: "currency" | "number" | "percentage") => {
        if (hideValues) return "••••";

        if (type === "currency") {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
        }
        if (type === "percentage") return `${val}%`;
        return val.toString();
    };

    const stats: StatItem[] = [
        { label: "Vendas Hoje", value: dados.vendasHoje, type: "currency", icon: DollarSign, color: "bg-green-500", trend: "+12%" },
        { label: "Pedidos", value: dados.pedidosHoje, type: "number", icon: ShoppingCart, color: "bg-blue-500", trend: "+5%" },
        { label: "Novos Clientes", value: dados.novosClientes, type: "number", icon: Users, color: "bg-purple-500", trend: "+2%" },
        { label: "Conversão", value: dados.conversao, type: "percentage", icon: TrendingUp, color: "bg-orange-500", trend: "+1.5%" },
    ];

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
                    <p className="text-gray-500">Acompanhe sua adega em tempo real.</p>
                </div>
                
                {/* BOTÃO DE ESCONDER/MOSTRAR */}
                <button 
                    onClick={() => setHideValues(!hideValues)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                >
                    {hideValues ? (
                        <><Eye className="w-4 h-4" /> Mostrar valores</>
                    ) : (
                        <><EyeOff className="w-4 h-4" /> Esconder valores</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.color} p-3 rounded-xl text-white`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                {stat.trend} <ArrowUpRight className="w-3 h-3" />
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            {formatDisplay(stat.value, stat.type)}
                        </h3>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Últimos Pedidos</h3>
                    <button className="text-blue-600 text-sm font-bold hover:underline">Ver todos</button>
                </div>
                
                {dados.ultimosPedidos.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum pedido hoje.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {dados.ultimosPedidos.map((pedido) => (
                            <div key={pedido.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{pedido.cliente}</p>
                                    <p className="text-sm text-gray-500">#{pedido.id.substring(0,8)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">
                                        {formatDisplay(pedido.valor, "currency")}
                                    </p>
                                    <span className="inline-block mt-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase bg-blue-50 text-blue-700">
                                        {pedido.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}