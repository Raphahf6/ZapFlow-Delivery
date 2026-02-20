"use client";

import React from "react";
import { TrendingUp, ShoppingCart, Users, DollarSign, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
    // Dados mockados para visualização inicial
    const stats = [
        { label: "Vendas Hoje", value: "R$ 1.240,00", icon: DollarSign, color: "bg-green-500", trend: "+12%" },
        { label: "Pedidos", value: "18", icon: ShoppingCart, color: "bg-blue-500", trend: "+5%" },
        { label: "Novos Clientes", value: "12", icon: Users, color: "bg-purple-500", trend: "+2%" },
        { label: "Conversão", value: "8.5%", icon: TrendingUp, color: "bg-orange-500", trend: "+1.5%" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
                <p className="text-gray-500">Acompanhe o desempenho da sua adega em tempo real.</p>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.color} p-3 rounded-xl text-white`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                {stat.trend} <ArrowUpRight className="w-3 h-3" />
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* ÁREA DE CONTEÚDO (EX: ÚLTIMOS PEDIDOS) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Últimos Pedidos</h3>
                    <button className="text-blue-600 text-sm font-bold hover:underline">Ver todos</button>
                </div>
                <div className="p-8 text-center text-gray-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhum pedido recebido hoje ainda.</p>
                    <p className="text-sm">Os pedidos aparecerão aqui assim que os clientes finalizarem o checkout.</p>
                </div>
            </div>
        </div>
    );
}