import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        
        // O Mercado Pago envia o ID do pagamento no corpo ou na query string
        const paymentId = body.data?.id || searchParams.get('data.id');
        const type = body.type || searchParams.get('type');

        // Só nos interessam notificações de pagamento
        if (type === 'payment' && paymentId) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // 1. Consultar os detalhes do pagamento no Mercado Pago para saber qual o status real
            // Precisamos do token de acesso da empresa. 
            // Para simplificar, o MP envia o ID do recurso, mas não envia de qual empresa é.
            // Estratégia: Vamos buscar o pagamento usando o seu Token Principal ou 
            // buscar na tabela de pedidos quem tem esse ID de pagamento (que vamos salvar agora).

            // NOTA: Para o Webhook ser 100% preciso, precisamos salvar o ID do pagamento no pedido
            // quando geramos o PIX. Vou assumir que o status será verificado via API do MP.
            
            // Vamos buscar o pedido que corresponde a este pagamento
            // (Ajuste: Adicione a coluna 'payment_id' na sua tabela Order se ainda não tiver)
            const { data: order, error: fetchError } = await supabaseAdmin
                .from('Order')
                .select('id, company_id')
                .eq('payment_id', paymentId.toString())
                .single();

            if (order) {
                // Buscar o token da empresa para validar o status no MP
                const { data: company } = await supabaseAdmin
                    .from('Company')
                    .select('mp_access_token')
                    .eq('id', order.company_id)
                    .single();

                if (company?.mp_access_token) {
                    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                        headers: { 'Authorization': `Bearer ${company.mp_access_token}` }
                    });
                    const paymentInfo = await mpRes.json();

                    if (paymentInfo.status === 'approved') {
                        // 2. ATUALIZAR O STATUS NO KANBAN
                        await supabaseAdmin
                            .from('Order')
                            .update({ 
                                payment_status: 'paid',
                                
                            })
                            .eq('id', order.id);
                        
                        console.log(`Pedido ${order.id} marcado como PAGO.`);
                    }
                }
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}