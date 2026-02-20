import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const companyId = searchParams.get('state'); // Usamos o "state" para passar o ID da empresa!
    const error = searchParams.get('error');

    // Se o usuário cancelou o login
    if (error || !code || !companyId) {
        return NextResponse.redirect(new URL('/admin/integrations?error=mp_auth_failed', request.url));
    }

    try {
        // 1. Troca o 'code' pelo 'access_token' chamando a API do Mercado Pago
        const mpResponse = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                client_secret: process.env.MP_CLIENT_SECRET!,
                client_id: process.env.NEXT_PUBLIC_MP_CLIENT_ID!,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/mp/callback`
            })
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("Erro MP:", mpData);
            throw new Error('Falha ao autenticar no Mercado Pago');
        }

        // 2. Salva o Token no Supabase para a empresa correta
        const { error: dbError } = await supabase
            .from('Company')
            .update({ 
                mp_access_token: mpData.access_token,
                // Se quiser salvar o refresh token no futuro, crie a coluna e adicione aqui:
                // mp_refresh_token: mpData.refresh_token 
            })
            .eq('id', companyId);

        if (dbError) throw dbError;

        // 3. Redireciona de volta para a tela de integrações com sucesso
        return NextResponse.redirect(new URL('/admin/integrations?success=mp_connected', request.url));

    } catch (err) {
        console.error("Erro no Callback do MP:", err);
        return NextResponse.redirect(new URL('/admin/integrations?error=server_error', request.url));
    }
}