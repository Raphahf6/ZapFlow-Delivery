"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit3, Package, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from("Product")
            .select("*, Category(name)")
            .order("created_at", { ascending: false });

        if (!error && data) setProducts(data);
        setLoading(false);
    }

    const toggleStock = async (productId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_stock: newStatus } : p));

        const { error } = await supabase.from("Product").update({ in_stock: newStatus }).eq("id", productId);

        if (error) {
            alert("Erro ao atualizar o estoque. Tente novamente.");
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_stock: currentStatus } : p));
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-24 md:pb-12 px-4 md:px-0">
            {/* HEADER RESPONSIVO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 md:pt-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Catálogo de Produtos</h1>
                    <p className="text-sm md:text-base text-gray-500">Gerencie o que aparece no seu link público.</p>
                </div>
                <Link 
                    href="/admin/products/new"
                    className="w-full md:w-auto inline-flex justify-center items-center gap-2 bg-blue-600 text-white px-5 py-3.5 md:py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 shrink-0"
                >
                    <Plus className="w-5 h-5" /> Adicionar Produto
                </Link>
            </div>

            {/* BARRA DE BUSCA */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Buscar por nome..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* ÁREA DE LISTAGEM HÍBRIDA */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <>
                        {/* VISÃO DESKTOP (TABELA) - Esconde no Mobile */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Produto</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Preço</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Disponibilidade</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className={`transition-colors ${!product.in_stock ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border ${product.in_stock ? 'bg-gray-100 border-gray-200' : 'bg-gray-200 border-gray-300 grayscale'}`}>
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <span className={`font-bold ${product.in_stock ? 'text-gray-900' : 'text-gray-500 line-through'}`}>{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                                {product.Category?.name || "Sem categoria"}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" checked={product.in_stock} onChange={() => toggleStock(product.id, product.in_stock)} />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                                    </label>
                                                    <span className={`text-xs font-bold ${product.in_stock ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {product.in_stock ? 'Ativo' : 'Oculto'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/admin/products/${product.id}`} className="inline-flex p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                                                    <Edit3 className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* VISÃO MOBILE (CARDS) - Esconde no Desktop */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {filteredProducts.map((product) => (
                                <div key={product.id} className={`p-4 flex flex-col gap-4 transition-opacity ${!product.in_stock ? 'bg-gray-50/50 opacity-80' : ''}`}>
                                    <div className="flex gap-4">
                                        <div className={`w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border ${product.in_stock ? 'bg-gray-100 border-gray-200' : 'bg-gray-200 border-gray-300 grayscale'}`}>
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-[15px] leading-tight mb-1 ${product.in_stock ? 'text-gray-900' : 'text-gray-500 line-through'}`}>{product.name}</h3>
                                            <p className="text-xs text-gray-500 mb-2">{product.Category?.name || "Sem categoria"}</p>
                                            <p className="font-extrabold text-gray-900">R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Ações Mobile */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={product.in_stock} onChange={() => toggleStock(product.id, product.in_stock)} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                            <span className={`text-xs font-bold ${product.in_stock ? 'text-green-600' : 'text-gray-400'}`}>
                                                {product.in_stock ? 'Estoque Ativo' : 'Oculto'}
                                            </span>
                                        </div>
                                        <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors font-bold text-sm">
                                            <Edit3 className="w-4 h-4" /> Editar
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-12 md:p-20 text-center text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum produto encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}