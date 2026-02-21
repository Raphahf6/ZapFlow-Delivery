"use client";

import React, { useState, useEffect, Suspense } from "react";
import { CreditCard, MessageCircle, CheckCircle, XCircle, Loader2, Link as LinkIcon, LogOut, QrCode, RefreshCw, SmartphoneNfc } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

const WHATSAPP_API_URL = "https://zapflow-whatsapp-api.onrender.com";

function IntegrationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState("");

    // Mercado Pago
    const [isMpConnected, setIsMpConnected] = useState(false);

    // WhatsApp
    const [wppStatus, setWppStatus] = useState<"DISCONNECTED" | "STARTING" | "QR_READY" | "CONNECTED">("DISCONNECTED");
    const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        if (searchParams.get('success') === 'mp_connected') {
            alert("Mercado Pago conectado com sucesso!");
            router.replace('/admin/integrations');
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
                    
                    // Verifica o status do WhatsApp assim que carregar a tela
                    checkWhatsAppStatus(data.id);
                }
            }
            setLoading(false);
        }
        loadCompany();
    }, [searchParams, router]);

    const checkWhatsAppStatus = async (cId: string) => {
        try {
            const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/status/${cId}`);
            const data = await res.json();

            setWppStatus(data.status);
            
            if (data.status === 'QR_READY') {
                setQrCodeBase64(data.qrCode);
            }

            // Continua perguntando a cada 3 segundos se ainda não estiver conectado
            if (data.status === 'STARTING' || data.status === 'QR_READY') {
                if (!isPolling) {
                    setIsPolling(true);
                    setTimeout(() => checkWhatsAppStatus(cId), 3000);
                }
            } else {
                setIsPolling(false);
            }
        } catch (error) {
            console.error("Erro ao checar status do WhatsApp:", error);
            setWppStatus("DISCONNECTED");
            setIsPolling(false);
        }
    };

    const handleConnectWhatsApp = () => {
        setWppStatus("STARTING");
        checkWhatsAppStatus(companyId);
    };

    const handleConnectMP = () => {
        const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
        const redirectUri = `${appUrl}/api/mp/callback`;

        if (!clientId) return alert("Configure o NEXT_PUBLIC_MP_CLIENT_ID");

        const mpAuthUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${companyId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
        window.location.href = mpAuthUrl;
    };

    const handleDisconnectMP = async () => {
        if (!confirm("Tem certeza que deseja desconectar o Mercado Pago?")) return;
        const { error } = await supabase.from("Company").update({ mp_access_token: null }).eq("id", companyId);
        if (!error) {
            setIsMpConnected(false);
            alert("Mercado Pago desconectado.");
        }
    };

    if (loading) return <div className="flex-1 flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-gray-900 pb-12">
            <div>
                <h1 className="text-2xl font-bold">Integrações</h1>
                <p className="text-gray-500">Conecte sua loja ao Mercado Pago e automatize seu WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* CARD: WHATSAPP / ZAPFLOW (Foco Principal) */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-500 text-white p-3 rounded-xl shadow-md"><MessageCircle className="w-6 h-6" /></div>
                            <div>
                                <h2 className="font-bold text-lg text-green-900">WhatsApp</h2>
                                <p className="text-xs text-green-700">Automação de Mensagens</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                        {wppStatus === 'CONNECTED' ? (
                            <div className="space-y-4">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">Aparelho Conectado!</h3>
                                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">O ZapFlow já está pronto para notificar seus clientes sobre os pedidos.</p>
                                </div>
                                <button onClick={handleConnectWhatsApp} className="text-xs font-bold text-gray-400 hover:text-red-500 mt-4 transition-colors">
                                    Desconectar / Trocar Aparelho
                                </button>
                            </div>
                        ) : wppStatus === 'STARTING' ? (
                            <div className="space-y-4">
                                <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
                                <h3 className="font-bold text-lg text-gray-900">Gerando Código...</h3>
                                <p className="text-sm text-gray-500">Estabelecendo conexão segura.</p>
                            </div>
                        ) : wppStatus === 'QR_READY' && qrCodeBase64 ? (
                            <div className="space-y-4 w-full">
                                <h3 className="font-bold text-gray-900 text-lg">Escaneie o QR Code</h3>
                                <div className="bg-white p-3 rounded-2xl shadow-sm inline-block mx-auto border-2 border-green-100">
                                    <img src={qrCodeBase64} alt="WhatsApp QR Code" className="w-56 h-56" />
                                </div>
                                <p className="text-xs text-gray-500 max-w-xs mx-auto">Abra o WhatsApp no celular da loja, vá em "Aparelhos Conectados" e aponte a câmera.</p>
                            </div>
                        ) : (
                            <div className="space-y-5 w-full">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                    <SmartphoneNfc className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Pronto para automatizar?</h3>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Conecte o WhatsApp do seu negócio para enviar recibos e avisos de entrega.</p>
                                </div>
                                <button 
                                    onClick={handleConnectWhatsApp} 
                                    className="w-full bg-green-600 text-white px-6 py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 hover:-translate-y-0.5"
                                >
                                    <QrCode className="w-5 h-5" /> Gerar QR Code
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* CARD: MERCADO PAGO */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md"><CreditCard className="w-6 h-6" /></div>
                            <div>
                                <h2 className="font-bold text-lg text-blue-900">Mercado Pago</h2>
                                <p className="text-xs text-blue-700">Recebimentos via Pix/Cartão</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                        {isMpConnected ? (
                            <div className="space-y-4">
                                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-white">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">Tudo pronto!</h3>
                                    <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">Sua conta do Mercado Pago está vinculada para receber pagamentos.</p>
                                </div>
                                <button onClick={handleDisconnectMP} className="flex items-center justify-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 mt-4 transition-colors mx-auto">
                                    <LogOut className="w-4 h-4" /> Desconectar
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5 w-full">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                                    <LinkIcon className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Vincule sua conta</h3>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">Permite a geração de QRCodes PIX dinâmicos direto no checkout do cliente.</p>
                                </div>
                                <button onClick={handleConnectMP} className="w-full bg-[#009EE3] text-white px-6 py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-[#0089c7] transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5">
                                    <CreditCard className="w-5 h-5" /> Conectar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function IntegrationsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
            <IntegrationsContent />
        </Suspense>
    );
}