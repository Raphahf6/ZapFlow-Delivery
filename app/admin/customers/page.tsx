"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Loader2, User, ShoppingBag, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"all" | "active" | "inactive">("all");

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: company } = await supabase.from("Company").select("id").eq("owner_id", user.id).single();
            if (!company) return;

            // Busca os clientes e os pedidos relacionados
            const { data, error } = await supabase
                .from("Customer")
                .select(`
                    *,
                    Order (
                        created_at
                    )
                `)
                .eq("company_id", company.id);

            if (error) throw error;

            if (data) {
                const processed = data.map(c => {
                    const orders = c.Order || [];
                    // Pega a data do pedido mais recente
                    const lastOrder = orders.length > 0 
                        ? orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                        : null;

                    const lastDate = lastOrder ? new Date(lastOrder.created_at) : null;
                    
                    // Consideramos inativo quem não pede há mais de 30 dias ou NUNCA pediu
                    const isInactive = !lastDate || (new Date().getTime() - lastDate.getTime()) > (30 * 24 * 60 * 60 * 1000);

                    return {
                        ...c,
                        totalOrders: orders.length,
                        lastOrderDate: lastDate,
                        isInactive
                    };
                });

                setCustomers(processed);
            }
        } catch (err) {
            console.error("Erro ao carregar clientes:", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
        if (filterType === "active") return matchesSearch && !c.isInactive;
        if (filterType === "inactive") return matchesSearch && c.isInactive;
        return matchesSearch;
    });

    // Função simples para formatar a data sem bibliotecas externas
    const formatarData = (date: Date | null) => {
        if (!date) return "Sem pedidos";
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6 text-gray-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Carteira de Clientes</h1>
                    <p className="text-gray-500">Total de {customers.length} clientes cadastrados.</p>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setFilterType("all")} className={`px-4 py-2 text-sm font-bold rounded-lg ${filterType === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Todos</button>
                    <button onClick={() => setFilterType("active")} className={`px-4 py-2 text-sm font-bold rounded-lg ${filterType === 'active' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>Ativos</button>
                    <button onClick={() => setFilterType("inactive")} className={`px-4 py-2 text-sm font-bold rounded-lg ${filterType === 'inactive' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>Sumidos</button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Buscar por nome ou WhatsApp..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : filtered.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Pedidos</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Última Compra</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><User className="w-5 h-5" /></div>
                                                <div>
                                                    <p className="font-bold">{customer.name}</p>
                                                    <p className="text-xs text-gray-500">{customer.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-gray-700">{customer.totalOrders}</span>
                                                <span className="text-[10px] uppercase text-gray-400 font-medium">compras</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {formatarData(customer.lastOrderDate)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {customer.isInactive ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                                                    <AlertCircle className="w-3 h-3" /> Sumido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                                                    <CheckCircle className="w-3 h-3" /> Ativo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum cliente encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}