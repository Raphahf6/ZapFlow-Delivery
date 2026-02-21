"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronLeft, Camera, Loader2, Trash2, Tag, AlignLeft, DollarSign, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const productId = React.use(params).id;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [inStock, setInStock] = useState(true);
    
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        loadData();
    }, [productId]);

    const loadData = async () => {
        setLoading(true);
        
        // 1. Pega a empresa do usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/login");

        const { data: company } = await supabase.from("Company").select("id").eq("owner_id", user.id).single();
        if (!company) return;

        // 2. Carrega as Categorias da empresa para o Dropdown
        const { data: cats } = await supabase.from("Category").select("*").eq("company_id", company.id).order("name");
        if (cats) setCategories(cats);

        // 3. Carrega os dados do Produto atual
        const { data: product, error } = await supabase.from("Product").select("*").eq("id", productId).single();
        
        if (error || !product) {
            alert("Produto não encontrado.");
            router.push("/admin/products");
            return;
        }

        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(product.price ? product.price.toString() : "");
        setCategoryId(product.category_id || "");
        setInStock(product.in_stock);
        if (product.image_url && !product.image_url.startsWith('blob:')) {
            setImageUrl(product.image_url);
        }
        
        setLoading(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalImageUrl = imageUrl;
            if (finalImageUrl.startsWith('blob:')) finalImageUrl = "";

            // Upload da nova foto caso o usuário tenha trocado
            if (imageFile) {
                const ext = imageFile.name.split('.').pop();
                const fileName = `prod_${productId}_${Math.random()}.${ext}`;
                const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, imageFile, { upsert: true });
                
                if (uploadErr) throw new Error(`Erro ao subir imagem: ${uploadErr.message}`);
                finalImageUrl = supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
            }

            // Atualiza no banco
            const { error } = await supabase.from("Product").update({
                name,
                description,
                price: parseFloat(price.replace(',', '.')),
                category_id: categoryId || null,
                in_stock: inStock,
                image_url: finalImageUrl
            }).eq("id", productId);

            if (error) throw error;
            
            alert("Produto atualizado com sucesso!");
            router.push("/admin/products");
            router.refresh(); // Força a página de listagem a recarregar os dados novos

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Erro ao salvar produto.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja excluir este produto DEFINITIVAMENTE? Isso não afetará pedidos antigos, mas removerá o item do catálogo.")) return;
        
        setDeleting(true);
        try {
            const { error } = await supabase.from("Product").delete().eq("id", productId);
            if (error) throw error;
            
            router.push("/admin/products");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert("Erro ao excluir produto.");
            setDeleting(false);
        }
    };

    if (loading) return <div className="flex-1 flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    return (
        <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-8 text-gray-900 pb-12">
            
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 -ml-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Editar Produto</h1>
                        <p className="text-gray-500">Atualize as informações do item.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={handleDelete} disabled={deleting} className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                        {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        <span className="hidden sm:inline">Excluir</span>
                    </button>
                    <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* COLUNA ESQUERDA: FOTO */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
                        <h2 className="font-bold text-lg border-b border-gray-100 pb-2">Foto do Produto</h2>
                        <div className="relative aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden group hover:border-blue-400 flex items-center justify-center transition-colors cursor-pointer">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-gray-400 flex flex-col items-center">
                                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                    <span className="text-sm font-medium">Adicionar Foto</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <p className="text-xs text-center text-gray-500 font-medium">Recomendado: 500x500px. Fundo branco ou transparente.</p>
                    </div>
                </div>

                {/* COLUNA DIREITA: DADOS */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <h2 className="font-bold text-lg border-b border-gray-100 pb-2">Detalhes</h2>
                        
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2"><Tag className="w-4 h-4"/> Nome do Produto</label>
                            <input type="text" required placeholder="Ex: Cerveja Heineken 330ml" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2"><DollarSign className="w-4 h-4"/> Preço (R$)</label>
                                <input type="number" step="0.01" required placeholder="0.00" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg" value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 uppercase">Categoria</label>
                                <select className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2"><AlignLeft className="w-4 h-4"/> Descrição (Opcional)</label>
                            <textarea rows={3} placeholder="Detalhes, marca, ingredientes..." className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-lg text-gray-900">Disponibilidade</h2>
                            <p className="text-sm text-gray-500">Se desmarcado, o produto some do cardápio público.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>
            </div>
        </form>
    );
}