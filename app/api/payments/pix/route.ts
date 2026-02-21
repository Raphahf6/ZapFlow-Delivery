import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const { orderId, companyId, total } = await request.json();

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Busca o Token do Mercado Pago dessa adega específica
        const { data: company } = await supabaseAdmin
            .from('Company')
            .select('mp_access_token')
            .eq('id', companyId)
            .single();

        if (!company?.mp_access_token) {
            return NextResponse.json({ error: 'Adega não configurada para Pix.' }, { status: 400 });
        }

        // 2. Cria o pagamento no Mercado Pago
        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${company.mp_access_token}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': orderId // Evita cobrança duplicada
            },
            body: JSON.stringify({
                transaction_amount: Number(total),
                description: `Pedido #${orderId.split('-')[0]} - ZapFlow`,
                payment_method_id: 'pix',
                installments: 1,
                payer: {
                    email: 'cliente@zapflow.com', // Opcional: usar email real do cliente
                }
            })
        });

        const paymentData = await mpResponse.json();

        if (!mpResponse.ok) throw new Error('Erro ao gerar Pix no Mercado Pago');

        // 3. Devolve os dados do Pix para o Frontend
        return NextResponse.json({
            qr_code: paymentData.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: paymentData.point_of_interaction.transaction_data.qr_code_base64,
            copy_paste: paymentData.point_of_interaction.transaction_data.qr_code,
            payment_id: paymentData.id
        });

    } catch (error: any) {
        console.error("Erro Pix API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}