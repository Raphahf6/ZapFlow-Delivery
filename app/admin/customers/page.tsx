"use client";

import React, { useState, useEffect } from "react";
import { Users, Phone, MapPin, Search, Loader2,User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function fetchCustomers() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: company } = await supabase.from("Company").select("id").eq("owner_id", user.id).single();
                if (company) {
                    const { data } = await supabase
                        .from("Customer")
                        .select("*")
                        .eq("company_id", company.id)
                        .order("created_at", { ascending: false });
                    if (data) setCustomers(data);
                }
            }
            setLoading(false);
        }
        fetchCustomers();
    }, []);

    const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

    return (
        <div className="space-y-6 text-gray-900">
            <div>
                <h1 className="text-2xl font-bold">Carteira de Clientes</h1>
                <p className="text-gray-500">Gerencie a base de clientes do seu delivery.</p>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Buscar cliente por nome ou WhatsApp..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
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
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">WhatsApp</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Endereços Salvos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User className="w-5 h-5" /></div>
                                            {customer.name}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{customer.phone}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {customer.saved_addresses?.length || 0} endereço(s)
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