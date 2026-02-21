"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Save, CreditCard, MessageCircle, CheckCircle, XCircle, Eye, EyeOff, Loader2, Link as LinkIcon, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function IntegrationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [savingWPP, setSavingWPP] = useState(false);
    const [companyId, setCompanyId] = useState("");

    // Mercado Pago
    const [isMpConnected, setIsMpConnected] = useState(false);

    // WhatsApp
    const [wppNumber, setWppNumber] = useState("");
    const [wppInstanceId, setWppInstanceId] = useState("");
    const [showInstanceId, setShowInstanceId] = useState(false);
    const [isWppConnected, setIsWppConnected] = useState(false);

    useEffect(() => {
        // Alertas de Sucesso/Erro vindos do Callback do OAuth
        if (searchParams.get('success') === 'mp_connected') {
            alert("Mercado Pago conectado com sucesso!");
            router.replace('/admin/integrations'); // limpa a URL
        } else if (searchParams.get('error')) {
            alert("Erro ao conectar Mercado Pago. Tente novamente.");
            router.replace('/admin/integrations');
        }

        async function loadCompany() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from("Company").select("*").eq("owner_id", user.id).single();
                if (data) {
                    setCompanyId(data.id);
                    if (data.mp_access_token) setIsMpConnected(true);
                    
                    setWppNumber(data.whatsapp_number || "");
                    if (data.whatsapp_instance_id) {
                        setWppInstanceId(data.whatsapp_instance_id);
                        setIsWppConnected(true);
                    }
                }
            }
            setLoading(false);
        }
        loadCompany();
    }, [searchParams, router]);

    // OAUTH FLOW DO MERCADO PAGO
    const handleConnectMP = () => {
        const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/mp/callback`;
        
        if (!clientId) return alert("Configure o NEXT_PUBLIC_MP_CLIENT_ID no seu .env.local");

        // Passamos o ID da empresa no parâmetro "state" para o callback saber quem está logando!
        const mpAuthUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${companyId}&redirect_uri=${redirectUri}`;
        
        window.location.href = mpAuthUrl; // Manda pro site azul do MP
    };

    const handleDisconnectMP = async () => {
        if (!confirm("Tem certeza que deseja desconectar o Mercado Pago? Você não receberá mais pagamentos automáticos.")) return;
        
        const { error } = await supabase.from("Company").update({ mp_access_token: null }).eq("id", companyId);
        if (!error) {
            setIsMpConnected(false);
            alert("Mercado Pago desconectado.");
        }
    };

    const handleSaveWhatsApp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingWPP(true);
        try {
            const { error } = await supabase.from("Company").update({ whatsapp_number: wppNumber, whatsapp_instance_id: wppInstanceId }).eq("id", companyId);
            if (error) throw error;
            setIsWppConnected(!!wppInstanceId.trim());
            alert("Integração do WhatsApp salva com sucesso!");
        } catch (error: any) {
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setSavingWPP(false);
        }
    };

    if (loading) return <div className="flex-1 flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-gray-900 pb-12">
            <div>
                <h1 className="text-2xl font-bold">Integrações</h1>
                <p className="text-gray-500">Conecte sua loja ao Mercado Pago e automatize seu WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                
                {/* CARD: MERCADO PAGO (OAUTH) */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md"><CreditCard className="w-6 h-6" /></div>
                            <div>
                                <h2 className="font-bold text-lg text-blue-900">Mercado Pago</h2>
                                <p className="text-xs text-blue-700">Receba pagamentos via Pix e Cartão diretamente na sua conta.</p>
                            </div>
                        </div>
                        {isMpConnected ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                                <CheckCircle className="w-4 h-4" /> Conectado
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                <XCircle className="w-4 h-4" /> Desconectado
                            </span>
                        )}
                    </div>
                    
                    <div className="p-6">
                        {isMpConnected ? (
                            <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl border border-green-100 space-y-4">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                                <div className="text-center">
                                    <h3 className="font-bold text-green-900">Tudo pronto para vender!</h3>
                                    <p className="text-sm text-green-700">Sua conta do Mercado Pago está vinculada.</p>
                                </div>
                                <button onClick={handleDisconnectMP} className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 mt-2 transition-colors">
                                    <LogOut className="w-4 h-4" /> Desconectar Conta
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                                    <LinkIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">Vincule sua conta</h3>
                                    <p className="text-sm text-gray-500 max-w-sm mx-auto">Ao conectar, o sistema irá gerar QRCodes PIX dinâmicos direto para sua conta do Mercado Pago.</p>
                                </div>
                                <button onClick={handleConnectMP} className="bg-[#009EE3] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#0089c7] transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 mt-2">
                                    <CreditCard className="w-5 h-5" /> Conectar com Mercado Pago
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* CARD: WHATSAPP / ZAPFLOW (Mantido igual) */}
                <form onSubmit={handleSaveWhatsApp} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-500 text-white p-3 rounded-xl shadow-md"><MessageCircle className="w-6 h-6" /></div>
                            <div>
                                <h2 className="font-bold text-lg text-green-900">WhatsApp Automático (ZapFlow)</h2>
                                <p className="text-xs text-green-700">Envie status de pedidos e alertas no WhatsApp do cliente.</p>
                            </div>
                        </div>
                        {isWppConnected ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                                <CheckCircle className="w-4 h-4" /> Conectado
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                <XCircle className="w-4 h-4" /> Desconectado
                            </span>
                        )}
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 uppercase">Número do WhatsApp da Loja</label>
                                <input type="text" placeholder="5511999999999" required className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-green-500 font-mono text-sm" value={wppNumber} onChange={(e) => setWppNumber(e.target.value.replace(/\D/g, ''))} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 uppercase">ID da Instância (API)</label>
                                <div className="relative">
                                    <input type={showInstanceId ? "text" : "password"} placeholder="zapflow-instance-xyz..." className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-green-500 font-mono text-sm" value={wppInstanceId} onChange={(e) => setWppInstanceId(e.target.value)} />
                                    <button type="button" onClick={() => setShowInstanceId(!showInstanceId)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showInstanceId ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={savingWPP} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50">
                                {savingWPP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar WhatsApp
                            </button>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    );
}

// Suspense wrapper obrigatório no Next 15 quando se usa useSearchParams
export default function IntegrationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
            <IntegrationsContent />
        </Suspense>
    );
}