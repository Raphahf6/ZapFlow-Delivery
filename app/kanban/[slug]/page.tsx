"use client";

import React, { useState, useEffect, use } from "react";
import { Clock, ChefHat, CheckCircle, Truck, Phone, MapPin, Loader2, RefreshCcw, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Order = {
    id: string;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    status: 'pending' | 'preparing' | 'ready' | 'delivered';
    payment_status: string;
    address_details: any;
    created_at: string;
};

const STATUS_COLUMNS = [
    { id: 'pending', title: 'Novos', icon: Clock, color: 'bg-orange-100 text-orange-600', borderColor: 'border-orange-200' },
    { id: 'preparing', title: 'Em Preparo', icon: ChefHat, color: 'bg-blue-100 text-blue-600', borderColor: 'border-blue-200' },
    { id: 'ready', title: 'Pronto', icon: CheckCircle, color: 'bg-green-100 text-green-600', borderColor: 'border-green-200' },
    { id: 'delivered', title: 'Entregue', icon: Truck, color: 'bg-gray-100 text-gray-600', borderColor: 'border-gray-200' },
];

export default function KanbanPage({ params }: { params: Promise<{ slug: string }> }) {
    // No Next 15 Client Components, usamos React.use() para desembrulhar o params
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState<any>(null);

    const fetchOrders = async (compId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from("Order")
            .select("*")
            .eq("company_id", compId)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    // BUSCA INICIAL E CONFIGURAÇÃO DA EMPRESA
    useEffect(() => {
        async function init() {
            const { data: comp } = await supabase
                .from("Company")
                .select("*")
                .eq("slug", slug)
                .single();

            if (comp) {
                setCompany(comp);
                fetchOrders(comp.id);
            } else {
                setLoading(false);
            }
        }
        init();
    }, [slug]);

    // O MOTOR EM TEMPO REAL (WEBSOCKETS)
    useEffect(() => {
        if (!company?.id) return;

        console.log("🟢 Conectando ao painel em tempo real...");

        // Inscreve no canal da tabela Order filtrando apenas os pedidos DESSA empresa
        const orderSubscription = supabase
            .channel('painel-pedidos-ao-vivo')
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuta INSERT (novo pedido), UPDATE (mudança de status) e DELETE
                    schema: 'public',
                    table: 'Order',
                    filter: `company_id=eq.${company.id}`
                },
                (payload) => {
                    console.log("⚡ Nova atividade no banco!", payload);

                    // Se for um NOVO pedido (INSERT), toca um aviso sonoro!
                    if (payload.eventType === 'INSERT') {
                        try {
                            // Som de caixa registradora/notificação
                            const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
                            audio.play().catch(e => console.log('O navegador bloqueou o áudio automático.'));
                        } catch (e) {
                            // ignora erros de áudio
                        }
                    }

                    // Atualiza os dados na tela instantaneamente
                    fetchOrders(company.id);
                }
            )
            .subscribe();

        // Limpa a conexão se o cara fechar a aba
        return () => {
            supabase.removeChannel(orderSubscription);
        };
    }, [company?.id]);

    const updateOrderStatus = async (orderId: string, currentStatus: string) => {
        const flow = ['pending', 'preparing', 'ready', 'delivered'];
        const currentIndex = flow.indexOf(currentStatus);
        if (currentIndex === -1 || currentIndex === flow.length - 1) return;

        const nextStatus = flow[currentIndex + 1];

        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o));

        const { error } = await supabase
            .from("Order")
            .update({ status: nextStatus })
            .eq("id", orderId);

        if (error) {
            alert("Erro ao atualizar status do pedido.");
            if (company?.id) fetchOrders(company.id);
        }
    };

    if (!company && !loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loja não encontrada.</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 text-gray-900 font-sans">
            {/* HEADER OPERACIONAL (Focado na equipe) */}
            <header className="bg-gray-900 text-white p-4 flex items-center justify-between shrink-0 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                        <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold leading-none">{company?.name || 'Carregando...'}</h1>
                        <span className="text-xs text-gray-400 font-medium">Painel Operacional da Cozinha/Balcão</span>
                    </div>
                </div>
                <button
                    onClick={() => company?.id && fetchOrders(company.id)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-colors active:scale-95"
                >
                    <RefreshCcw className="w-4 h-4" /> Atualizar Agora
                </button>
            </header>

            {loading && orders.length === 0 ? (
                <div className="flex-1 flex justify-center items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
            ) : (
                /* ÁREA DO KANBAN COM CORREÇÃO DE GRID E SCROLL */
                <main className="flex-1 overflow-x-auto p-6">
                    {/* O min-w-[1200px] garante que as 4 colunas nunca vão se espremer, resolvendo o bug da coluna sumindo */}
                    <div className="grid grid-cols-4 gap-6 min-w-[1200px] h-full">
                        {STATUS_COLUMNS.map((col) => {
                            const columnOrders = orders.filter(o => o.status === col.id);

                            return (
                                <div key={col.id} className="flex flex-col bg-gray-200/50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner h-full">
                                    {/* Cabeçalho da Coluna */}
                                    <div className={`p-4 border-b ${col.borderColor} flex items-center justify-between bg-white shadow-sm z-10`}>
                                        <div className="flex items-center gap-2 font-bold text-gray-800">
                                            <div className={`p-1.5 rounded-lg ${col.color}`}>
                                                <col.icon className="w-5 h-5" />
                                            </div>
                                            {col.title}
                                        </div>
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                                            {columnOrders.length}
                                        </span>
                                    </div>

                                    {/* Lista de Cards */}
                                    <div className="flex-1 p-3 overflow-y-auto space-y-3">
                                        {columnOrders.map((order) => (
                                            <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                                {/* Faixa de cor baseada no pagamento */}
                                                <div className={`absolute top-0 left-0 w-1 h-full ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`}></div>

                                                <div className="pl-2">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-gray-400">
                                                            #{order.id.split('-')[0].toUpperCase()}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`}>
                                                            {order.payment_status === 'paid' ? 'PAGO' : 'NÃO PAGO'}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-bold text-gray-900 mb-1 text-lg">{order.customer_name}</h3>

                                                    <div className="space-y-1.5 mt-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                        <p className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                                                            <Phone className="w-4 h-4 text-blue-500" />
                                                            {order.customer_phone}
                                                        </p>
                                                        <p className="text-sm text-gray-700 flex items-start gap-2 font-medium">
                                                            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                            <span className="line-clamp-3">{order.address_details?.address || 'Retirada no Balcão'}</span>
                                                        </p>
                                                        {/* NOVA INFORMAÇÃO DE PAGAMENTO E TROCO */}
                                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                                            <p className="text-sm text-gray-700 flex items-start gap-2 font-bold">
                                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                                                    {order.address_details?.paymentMethod || 'Padrão'}
                                                                </span>
                                                                {order.address_details?.paymentMethod === 'DINHEIRO' && order.address_details?.changeFor && (
                                                                    <span className="text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-xs">
                                                                        Troco p/ R$ {order.address_details?.changeFor}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <span className="font-extrabold text-blue-600 text-lg">
                                                            R$ {Number(order.total_price).toFixed(2).replace('.', ',')}
                                                        </span>

                                                        {col.id !== 'delivered' && (
                                                            <button
                                                                onClick={() => updateOrderStatus(order.id, order.status)}
                                                                className="text-sm font-bold bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors active:scale-95 shadow-md shadow-gray-900/20"
                                                            >
                                                                Avançar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {columnOrders.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                                                <Clock className="w-6 h-6 mb-2 opacity-50" />
                                                Fila vazia
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            )}
        </div>
    );
}