"use client";

import React, { useState, useEffect } from "react";
import { Save, Store, MapPin, Clock, Camera, Loader2, Image as ImageIcon, Bike, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

const defaultSchedule = {
    monday: { isOpen: true, open: "09:00", close: "18:00", label: "Segunda-feira" },
    tuesday: { isOpen: true, open: "09:00", close: "18:00", label: "Terça-feira" },
    wednesday: { isOpen: true, open: "09:00", close: "18:00", label: "Quarta-feira" },
    thursday: { isOpen: true, open: "09:00", close: "18:00", label: "Quinta-feira" },
    friday: { isOpen: true, open: "09:00", close: "22:00", label: "Sexta-feira" },
    saturday: { isOpen: true, open: "10:00", close: "23:59", label: "Sábado" },
    sunday: { isOpen: false, open: "10:00", close: "14:00", label: "Domingo" },
};

type ScheduleType = typeof defaultSchedule;
type DayKey = keyof ScheduleType;

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyId, setCompanyId] = useState("");

    const [name, setName] = useState("");
    const [storeCategory, setStoreCategory] = useState("Adega e Bebidas");
    const [schedule, setSchedule] = useState<ScheduleType>(defaultSchedule);
    
    const [currentAddressLabel, setCurrentAddressLabel] = useState("");
    const [cep, setCep] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");
    const [neighborhood, setNeighborhood] = useState("");
    const [city, setCity] = useState("");
    const [isSearchingCep, setIsSearchingCep] = useState(false);

    const [baseKm, setBaseKm] = useState(5);
    const [baseFee, setBaseFee] = useState(5);
    const [extraFee, setExtraFee] = useState(8);

    const [logoUrl, setLogoUrl] = useState("");
    const [bannerUrl, setBannerUrl] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    useEffect(() => {
        async function loadCompany() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from("Company").select("*").eq("owner_id", user.id).single();
                if (data) {
                    setCompanyId(data.id);
                    setName(data.name || "");
                    setStoreCategory(data.store_category || "Adega e Bebidas");
                    setCurrentAddressLabel(data.address || "Nenhum endereço cadastrado.");
                    
                    // Só seta no estado se não for um blob quebrado salvo por engano
                    if (data.logo_url && !data.logo_url.startsWith('blob:')) setLogoUrl(data.logo_url);
                    if (data.banner_url && !data.banner_url.startsWith('blob:')) setBannerUrl(data.banner_url);
                    
                    if (data.business_hours && Object.keys(data.business_hours).length > 0) {
                        setSchedule({ ...defaultSchedule, ...data.business_hours });
                    }
                    if (data.delivery_rules) {
                        setBaseKm(Number(data.delivery_rules.baseKm) || 5);
                        setBaseFee(Number(data.delivery_rules.baseFee) || 5);
                        setExtraFee(Number(data.delivery_rules.extraFee) || 8);
                    }
                }
            }
            setLoading(false);
        }
        loadCompany();
    }, []);

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        setCep(val);
        if(val.length === 8) {
             setIsSearchingCep(true);
             try {
                 const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
                 const data = await res.json();
                 if(!data.erro) {
                     setStreet(data.logradouro);
                     setNeighborhood(data.bairro);
                     setCity(data.localidade);
                 } else {
                     alert("CEP não encontrado.");
                 }
             } catch (error) {
                 console.error("Erro ao buscar CEP", error);
             } finally {
                 setIsSearchingCep(false);
             }
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'logo') {
                setLogoFile(file);
                setLogoUrl(URL.createObjectURL(file));
            } else {
                setBannerFile(file);
                setBannerUrl(URL.createObjectURL(file));
            }
        }
    };

    const handleScheduleChange = (day: DayKey, field: 'isOpen' | 'open' | 'close', value: any) => {
        setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalLogoUrl = logoUrl;
            let finalBannerUrl = bannerUrl;
            let lat = null, lng = null;

            // Prevenção absoluta: Se for blob, zera antes de enviar pro banco
            if (finalLogoUrl.startsWith('blob:')) finalLogoUrl = "";
            if (finalBannerUrl.startsWith('blob:')) finalBannerUrl = "";

            const fullAddress = (street && number && city) 
                ? `${street}, ${number} - ${neighborhood}, ${city}` 
                : currentAddressLabel;

            if (fullAddress && fullAddress !== "Nenhum endereço cadastrado.") {
                try {
                    const query = (street && number && city) ? `${street}, ${number}, ${city}, Brazil` : fullAddress;
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`, {
                        headers: { 'User-Agent': 'ZapFlowApp/1.0' }
                    });
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                        lat = parseFloat(geoData[0].lat);
                        lng = parseFloat(geoData[0].lon);
                    }
                } catch (geoErr) {
                    console.error("Erro na geolocalização:", geoErr);
                }
            }

            if (logoFile) {
                const ext = logoFile.name.split('.').pop();
                const fileName = `logo_${companyId}_${Math.random()}.${ext}`;
                const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, logoFile, { upsert: true });
                
                if (uploadErr) {
                    throw new Error(`Erro no Supabase Storage (Logo): ${uploadErr.message}`);
                }
                finalLogoUrl = supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
            }

            if (bannerFile) {
                const ext = bannerFile.name.split('.').pop();
                const fileName = `banner_${companyId}_${Math.random()}.${ext}`;
                const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, bannerFile, { upsert: true });
                
                if (uploadErr) {
                    throw new Error(`Erro no Supabase Storage (Banner): ${uploadErr.message}`);
                }
                finalBannerUrl = supabase.storage.from('products').getPublicUrl(fileName).data.publicUrl;
            }

            const payload: any = {
                name,
                store_category: storeCategory, 
                address: fullAddress, 
                logo_url: finalLogoUrl, 
                banner_url: finalBannerUrl,
                business_hours: schedule, 
                delivery_rules: { baseKm, baseFee, extraFee }
            };

            if (lat && lng) {
                payload.lat = lat;
                payload.lng = lng;
            }

            const { error } = await supabase.from("Company").update(payload).eq("id", companyId);

            if (error) throw error;
            
            alert("Configurações salvas com sucesso!");
            setCurrentAddressLabel(fullAddress);
            setLogoFile(null);
            setBannerFile(null);

            // Atualiza o visual da tela com o link público definitivo
            setLogoUrl(finalLogoUrl);
            setBannerUrl(finalBannerUrl);

        } catch (error: any) {
            console.error(error);
            alert(`Falha ao salvar: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex-1 flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <form onSubmit={handleSave} className="max-w-5xl mx-auto space-y-8 text-gray-900 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Configurações da Loja</h1>
                    <p className="text-gray-500">Ajuste as regras do seu negócio e a aparência.</p>
                </div>
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* CARD 1: IDENTIDADE VISUAL */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><ImageIcon className="w-5 h-5" /></div>
                            <h2 className="font-bold text-lg">Identidade Visual</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Banner do Cardápio</label>
                                <div className="relative h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden group hover:border-blue-400 flex items-center justify-center transition-colors">
                                    {bannerUrl ? <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-gray-400 opacity-50" />}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-lg">Trocar Banner</span>
                                    </div>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div className="flex items-end gap-6">
                                <div className="relative w-32 h-32 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 overflow-hidden group flex shrink-0 items-center justify-center -mt-12 bg-white ring-4 ring-white shadow-md">
                                    {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-gray-400 opacity-50" />}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <div className="flex-1 pb-2"><p className="text-sm text-gray-500 font-medium">Sua logo aparecerá por cima do banner.</p></div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: DADOS DO NEGÓCIO & FRETE */}
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><MapPin className="w-5 h-5" /></div>
                            <h2 className="font-bold text-lg">Localização e Frete Inteligente</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-sm font-bold text-gray-700 uppercase">Nome da Adega</label>
                                    <input type="text" required className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <label className="text-sm font-bold text-gray-700 uppercase">Categoria</label>
                                    <input type="text" placeholder="Ex: Adega e Bebidas, Pizzaria..." required className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={storeCategory} onChange={(e) => setStoreCategory(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-bold text-gray-700 uppercase">Endereço da Adega (Usado no GPS)</label>
                                </div>
                                
                                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm border border-blue-100 mb-2">
                                    <span className="font-bold">Endereço Atual:</span> {currentAddressLabel}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 relative">
                                        {isSearchingCep ? <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" /> : <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
                                        <input type="text" placeholder="Digite o CEP para atualizar..." className="w-full p-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={cep} onChange={handleCepChange} maxLength={8} />
                                    </div>
                                    <input type="text" placeholder="Rua / Avenida" className="col-span-2 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={street} onChange={e => setStreet(e.target.value)} />
                                    <input type="text" placeholder="Número" className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={number} onChange={e => setNumber(e.target.value)} />
                                    <input type="text" placeholder="Bairro" className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                                    <input type="text" placeholder="Cidade" className="col-span-2 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={city} onChange={e => setCity(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                                <h3 className="font-bold text-blue-900 flex items-center gap-2"><Bike className="w-5 h-5" /> Regras de Taxa de Entrega</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-blue-800 uppercase">Distância Base (KM)</label>
                                        <input type="number" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg outline-none" value={baseKm} onChange={e => setBaseKm(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-blue-800 uppercase">Preço Até {baseKm} KM</label>
                                        <input type="number" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg outline-none" value={baseFee} onChange={e => setBaseFee(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-blue-800 uppercase">Acima de {baseKm} KM</label>
                                        <input type="number" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg outline-none" value={extraFee} onChange={e => setExtraFee(Number(e.target.value))} />
                                    </div>
                                </div>
                                <p className="text-xs text-blue-700 mt-2">Calculamos o trajeto real nas ruas usando as coordenadas da loja e do cliente.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden sticky top-8">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg"><Clock className="w-5 h-5" /></div>
                            <h2 className="font-bold text-lg">Horário Comercial</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {(Object.keys(schedule) as DayKey[]).map((day) => (
                                <div key={day} className="flex flex-col gap-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-gray-800">{schedule[day].label}</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={schedule[day].isOpen} onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>
                                    {schedule[day].isOpen && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input type="time" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none font-medium" value={schedule[day].open} onChange={(e) => handleScheduleChange(day, 'open', e.target.value)} />
                                            <span className="text-gray-400 text-sm">até</span>
                                            <input type="time" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none font-medium" value={schedule[day].close} onChange={(e) => handleScheduleChange(day, 'close', e.target.value)} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}