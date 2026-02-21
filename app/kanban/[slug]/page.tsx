"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, MessageCircle, MapPin, Bike, CheckCircle, Clock, Banknote, CreditCard, ShoppingBag, ChevronRight, Volume2, VolumeX, Printer, XCircle } from "lucide-react";

type Order = {
    id: string;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    status: 'pending' | 'preparing' | 'delivering' | 'completed' | 'cancelled';
    payment_status: 'paid' | 'unpaid';
    address_details: any;
    OrderItem: {
        id: string;
        quantity: number;
        unit_price: number;
        Product: { name: string };
    }[];
};

const STATUS_COLUMNS = [
    { id: 'pending', title: 'Novos Pedidos', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700' },
    { id: 'preparing', title: 'Em Preparo', color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
    { id: 'delivering', title: 'Em Rota (Entrega)', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
];

const CASH_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3";

export default function KanbanPage({ params }: { params: Promise<{ slug: string }> }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState("");
    const [companyName, setCompanyName] = useState("");

    const [isSoundOn, setIsSoundOn] = useState(false);
    const soundRef = useRef(false);

    const slug = React.use(params).slug;

    useEffect(() => {
        loadData();
    }, [slug]);

    const loadData = async () => {
        setLoading(true);
        const { data: company } = await supabase.from("Company").select("id, name").eq("slug", slug).single();

        if (company) {
            setCompanyId(company.id);
            setCompanyName(company.name);
            fetchOrders(company.id);
            setupRealtime(company.id);
        }
        setLoading(false);
    };

    const fetchOrders = async (cId: string) => {
        const { data, error } = await supabase
            .from("Order")
            .select(`
                *,
                OrderItem (
                    id, quantity, unit_price,
                    Product ( name )
                )
            `)
            .eq("company_id", cId)
            .neq("status", "completed")
            .neq("status", "cancelled")
            .order("created_at", { ascending: true });

        if (!error && data) {
            setOrders(data as any);
        }
    };

    const setupRealtime = (cId: string) => {
        const channel = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'Order', filter: `company_id=eq.${cId}` },
                (payload) => {
                    fetchOrders(cId);

                    if (payload.eventType === 'INSERT' && soundRef.current) {
                        const audio = new Audio(CASH_SOUND_URL);
                        audio.play().catch(e => console.error("Áudio bloqueado pelo navegador:", e));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        // Se for cancelar, pede confirmação
        if (newStatus === 'cancelled') {
            if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
        }

        // Acha o pedido atual para pegar o telefone do cliente
        const orderToUpdate = orders.find(o => o.id === orderId);

        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
        await supabase.from("Order").update({ status: newStatus }).eq("id", orderId);

        // Se o status for final (concluído ou cancelado), removemos da visualização do Kanban
        if (newStatus === 'completed' || newStatus === 'cancelled') {
            setOrders(prev => prev.filter(o => o.id !== orderId));
        }

        // NOVA LÓGICA: DISPARO DE WHATSAPP (SAIU PARA ENTREGA)
        if (newStatus === 'delivering' && orderToUpdate) {
            try {
                const shortId = orderId.split('-')[0].toUpperCase();
                const msgEntrega = `🛵 *Saiu para Entrega!*\n\nOpa, ${orderToUpdate.customer_name}!\n\nSeu pedido #${shortId} da *${companyName}* acabou de sair daqui com o nosso entregador.\n\nFique de olho no portão (${orderToUpdate.address_details?.paymentMethod})! Obrigado pela preferência.`;

                await fetch('https://zapflow-whatsapp-api.onrender.com/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyId: companyId,
                        phone: orderToUpdate.customer_phone,
                        message: msgEntrega
                    })
                });
            } catch (err) {
                console.error("Erro ao enviar zap de entrega:", err);
            }
        }
    };

    const openWhatsApp = (phone: string, orderId: string, customerName: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const shortId = orderId.split('-')[0].toUpperCase();

        const text = `Olá ${customerName}, somos da ${companyName}! Sobre o seu pedido #${shortId}...`;
        window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const toggleSound = () => {
        const newState = !isSoundOn;
        setIsSoundOn(newState);
        soundRef.current = newState;

        if (newState) {
            const audio = new Audio(CASH_SOUND_URL);
            audio.volume = 0.5;
            audio.play().catch(() => console.log("Aguardando interação."));
        }
    };

    const printOrder = (order: Order) => {
        const timeStr = new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = new Date(order.created_at).toLocaleDateString('pt-BR');
        const shortId = order.id.split('-')[0].toUpperCase();
        const pm = order.address_details?.paymentMethod;
        const isPaid = order.payment_status === 'paid' ? 'SIM' : 'NAO';

        const itemsHtml = order.OrderItem?.map((item: any) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>${item.quantity}x ${item.Product?.name || 'Produto'}</span>
                <span>R$ ${(Number(item.unit_price) * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
        `).join('');

        const html = `
            <html>
            <head>
                <title>Cupom #${shortId}</title>
                <style>
                    body { 
                        font-family: 'Courier New', Courier, monospace; 
                        font-size: 12px; 
                        margin: 0; 
                        padding: 10px; 
                        width: 300px; 
                        color: #000; 
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .flex-between { display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <div class="center bold" style="font-size: 16px; margin-bottom: 5px;">${companyName}</div>
                <div class="center">PEDIDO #${shortId}</div>
                <div class="center">${dateStr} às ${timeStr}</div>
                <div class="divider"></div>
                <div><span class="bold">CLIENTE:</span> ${order.customer_name}</div>
                <div><span class="bold">TELEFONE:</span> ${order.customer_phone}</div>
                <div style="margin-top: 5px;"><span class="bold">ENDERECO DE ENTREGA:</span><br/>${order.address_details?.address || 'Retirada no local'}</div>
                <div class="divider"></div>
                <div class="bold" style="margin-bottom: 5px;">ITENS DO PEDIDO:</div>
                ${itemsHtml}
                <div class="divider"></div>
                ${order.address_details?.deliveryFee ? `
                <div class="flex-between" style="margin-bottom: 5px;">
                    <span>Taxa de Entrega:</span>
                    <span>R$ ${Number(order.address_details.deliveryFee).toFixed(2).replace('.', ',')}</span>
                </div>` : ''}
                <div class="flex-between bold" style="font-size: 14px;">
                    <span>TOTAL:</span>
                    <span>R$ ${Number(order.total_price).toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="divider"></div>
                <div><span class="bold">PAGAMENTO:</span> ${pm}</div>
                <div><span class="bold">STATUS:</span> ${isPaid === 'SIM' ? 'PAGO' : 'A COBRAR'}</div>
                ${pm === 'DINHEIRO' && order.address_details?.changeFor ? `<div style="margin-top: 5px; font-size: 14px;"><span class="bold">LEVAR TROCO PARA:</span> R$ ${Number(order.address_details.changeFor).toFixed(2).replace('.', ',')}</div>` : ''}
                <div class="divider"></div>
                <div class="center" style="margin-top: 20px;">Obrigado pela preferencia!</div>
                <div class="center" style="margin-top: 5px; font-size: 10px;">Gerado por ZapFlow</div>
                <script>
                    window.onload = function() { 
                        window.print(); 
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            alert("Por favor, permita pop-ups no seu navegador para imprimir o pedido.");
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="h-screen overflow-hidden bg-gray-100 font-sans flex flex-col">
            <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="font-extrabold text-xl text-gray-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                            {companyName} <span className="hidden md:inline text-gray-400 font-medium text-base ml-1">| Operação Ao Vivo</span>
                        </h1>
                    </div>

                    <button
                        onClick={toggleSound}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm ${isSoundOn ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isSoundOn ? "Notificações Ligadas" : "Ativar Notificações"}</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full h-[calc(100vh-64px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {STATUS_COLUMNS.map((column) => {
                        const columnOrders = orders.filter(o => o.status === column.id);

                        return (
                            <div key={column.id} className="bg-gray-200/50 rounded-3xl p-4 h-full flex flex-col border border-gray-200 overflow-hidden">
                                <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${column.color} shadow-sm`}></div>
                                        <h2 className="font-bold text-gray-800 text-lg">{column.title}</h2>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${column.bg} ${column.text}`}>
                                        {columnOrders.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-12 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                                    {columnOrders.map(order => {
                                        const timeStr = new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                        const shortId = order.id.split('-')[0].toUpperCase();
                                        const isPaid = order.payment_status === 'paid';
                                        const pm = order.address_details?.paymentMethod;

                                        return (
                                            <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow">

                                                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                                                    <div>
                                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">#{shortId}</span>
                                                        <h3 className="font-bold text-gray-900 mt-2 text-lg leading-tight">{order.customer_name}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Botão Cancelar Pedido */}
                                                        <button
                                                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                            title="Cancelar Pedido"
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                        <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium bg-gray-50 px-2 py-1 rounded-lg">
                                                            <Clock className="w-4 h-4" /> {timeStr}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100/50">
                                                    <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <ShoppingBag className="w-4 h-4" /> Itens do Pedido
                                                    </h4>
                                                    <ul className="space-y-1.5">
                                                        {order.OrderItem?.map((item: any) => (
                                                            <li key={item.id} className="text-sm text-gray-700 flex justify-between items-start font-medium">
                                                                <span><span className="font-bold text-orange-600">{item.quantity}x</span> {item.Product?.name || "Produto excluído"}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 text-sm">
                                                    <div className="flex items-start gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                                        <span className="leading-tight">{order.address_details?.address || "Retirada no local"}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50">
                                                        <div className="flex items-center gap-2">
                                                            {pm === 'PIX' ? <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-xs flex items-center gap-1"><div className="font-serif leading-none">P</div> PIX</span> :
                                                                pm === 'CARTAO' ? <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cartão</span> :
                                                                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs flex items-center gap-1"><Banknote className="w-3 h-3" /> Dinheiro</span>}

                                                            {isPaid ?
                                                                <span className="text-xs font-bold text-green-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Pago</span> :
                                                                <span className="text-xs font-bold text-red-500">A Cobrar</span>
                                                            }
                                                        </div>
                                                        <span className="font-extrabold text-gray-900 text-lg">R$ {Number(order.total_price).toFixed(2).replace('.', ',')}</span>
                                                    </div>

                                                    {pm === 'DINHEIRO' && order.address_details?.changeFor && (
                                                        <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-bold mt-1 border border-red-100">
                                                            🚨 Levar troco para R$ {Number(order.address_details.changeFor).toFixed(2).replace('.', ',')}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2 mt-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => openWhatsApp(order.customer_phone, order.id, order.customer_name)}
                                                            className="bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                                                        >
                                                            <MessageCircle className="w-4 h-4" /> WhatsApp
                                                        </button>

                                                        {column.id === 'pending' && (
                                                            <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-colors shadow-sm">
                                                                Preparar <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {column.id === 'preparing' && (
                                                            <button onClick={() => updateOrderStatus(order.id, 'delivering')} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-colors shadow-sm">
                                                                Despachar <Bike className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {column.id === 'delivering' && (
                                                            <button onClick={() => updateOrderStatus(order.id, 'completed')} className="bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition-colors shadow-sm">
                                                                Entregue <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => printOrder(order)}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200"
                                                    >
                                                        <Printer className="w-4 h-4" /> Imprimir Cupom
                                                    </button>
                                                </div>

                                            </div>
                                        );
                                    })}

                                    {columnOrders.length === 0 && (
                                        <div className="flex flex-col items-center justify-center text-gray-400 opacity-50 border-2 border-dashed border-gray-300 rounded-2xl mt-2 p-6 text-center h-48">
                                            <ShoppingBag className="w-8 h-8 mb-2" />
                                            <p className="text-sm font-medium">Nenhum pedido aqui</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}