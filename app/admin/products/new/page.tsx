"use client";

import React, { useState, useEffect } from "react";
import { Camera, Save, ArrowLeft, Wand2, Loader2, X, Plus, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewProductPage() {
    const router = useRouter();
    
    // Estados de Loading
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    
    // Estados do Formulário
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Estados de Categoria
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [savingCategory, setSavingCategory] = useState(false);

    // 1. Carregar Empresa e Categorias ao abrir a tela
    useEffect(() => {
        async function loadInitialData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: company } = await supabase
                    .from("Company")
                    .select("id")
                    .eq("owner_id", user.id)
                    .single();

                if (company) {
                    setCompanyId(company.id);
                    
                    const { data: cats } = await supabase
                        .from("Category")
                        .select("*")
                        .eq("company_id", company.id)
                        .order("created_at", { ascending: true });
                        
                    if (cats) setCategories(cats);
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoadingData(false);
            }
        }
        loadInitialData();
    }, []);

    // 2. Criar nova Categoria Inline
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim() || !companyId) return;
        setSavingCategory(true);

        try {
            const { data, error } = await supabase
                .from("Category")
                .insert([{ company_id: companyId, name: newCategoryName }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setCategories([...categories, data]);
                setSelectedCategoryId(data.id);
                setIsAddingCategory(false);
                setNewCategoryName("");
            }
        } catch (error) {
            alert("Erro ao criar categoria.");
        } finally {
            setSavingCategory(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleMagicFill = async () => {
        if (!imagePreview) return;
        setAnalyzing(true);
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile!);
            reader.onloadend = async () => {
                const base64data = reader.result;
                const res = await fetch("/api/analyze-label", {
                    method: "POST",
                    body: JSON.stringify({ image: base64data }),
                });
                const data = await res.json();
                if (data.name) {
                    setName(data.name);
                    setDescription(data.description);
                    setPrice(data.suggested_price.toString());
                }
            };
        } catch (err) {
            console.error(err);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId) return alert("Erro: Empresa não identificada.");
        
        setLoading(true);

        try {
            let image_url = "";

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
                image_url = publicUrl;
            }

            const { error } = await supabase.from("Product").insert([{
                company_id: companyId,
                category_id: selectedCategoryId || null,
                name,
                description,
                price: parseFloat(price.toString().replace(',', '.')),
                image_url,
                in_stock: true
            }]);

            if (error) throw error;
            router.push("/admin/products");
        } catch (err: any) {
            alert(`Erro ao salvar produto: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-8 text-gray-900">
            <div className="flex items-center justify-between">
                <Link href="/admin/products" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </Link>
                <button 
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Produto</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* UPLOAD DE FOTO & IA */}
                <div className="lg:col-span-1 space-y-4">
                    <label className="block text-sm font-bold text-gray-700 uppercase">Foto do Produto</label>
                    <div className="relative group aspect-square bg-gray-100 border-2 border-dashed border-gray-300 rounded-3xl overflow-hidden flex flex-col items-center justify-center transition-all hover:border-blue-400">
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Camera className="w-12 h-12 text-gray-300 mb-2 group-hover:text-blue-400" />
                                <span className="text-xs font-medium text-gray-500 text-center px-4 uppercase">Toque para tirar foto ou subir</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={handleImageChange}
                        />
                    </div>
                    
                    {imagePreview && (
                        <button 
                            type="button"
                            onClick={handleMagicFill}
                            disabled={analyzing}
                            className="w-full py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-100 transition-all disabled:opacity-50"
                        >
                            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Wand2 className="w-5 h-5" /> Preencher com IA</>}
                        </button>
                    )}
                </div>

                {/* DADOS DO FORMULÁRIO */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-5">
                        
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 uppercase">Nome do Produto</label>
                            <input 
                                type="text"
                                required
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Ex: Cerveja Heineken 600ml"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* NOVO CAMPO: CATEGORIAS INLINE */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 uppercase">Categoria</label>
                            {isAddingCategory ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text"
                                        autoFocus
                                        className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Nome da nova categoria..."
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleCreateCategory}
                                        disabled={savingCategory || !newCategoryName.trim()}
                                        className="bg-green-600 text-white p-3.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {savingCategory ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => { setIsAddingCategory(false); setNewCategoryName(""); }}
                                        className="bg-gray-200 text-gray-600 p-3.5 rounded-xl hover:bg-gray-300 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <select 
                                        className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Selecione uma categoria...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        onClick={() => setIsAddingCategory(true)}
                                        className="bg-blue-50 text-blue-600 px-4 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors whitespace-nowrap"
                                    >
                                        <Plus className="w-5 h-5" /> Nova
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 uppercase">Descrição (Opcional)</label>
                            <textarea 
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all h-24"
                                placeholder="Detalhes do produto, temperatura, etc..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 uppercase">Preço de Venda</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-lg"
                                        placeholder="0,00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}