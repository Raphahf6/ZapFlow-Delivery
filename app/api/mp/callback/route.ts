import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const companyId = searchParams.get('state');

    if (!code || !companyId) {
        return NextResponse.redirect(new URL('/admin/integrations?error=invalid_params', request.url));
    }

    // 1. Criar um cliente Supabase com a Service Role (Admin)
    // Isso ignora o RLS e não depende de cookies de sessão/cookies expirados
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 2. Trocar código pelo token (mesmo código de antes)
        const response = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                client_id: process.env.NEXT_PUBLIC_MP_CLIENT_ID!,
                client_secret: process.env.MP_CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/mp/callback`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro MP:", data);
            return NextResponse.redirect(new URL('/admin/integrations?error=exchange_failed', request.url));
        }

        // 3. Salvar usando o cliente ADMIN (supabaseAdmin)
        // Como o ID da empresa veio no 'state', o banco saberá exatamente qual linha atualizar
        const { error: dbError } = await supabaseAdmin
            .from('Company')
            .update({ 
                mp_access_token: data.access_token 
            })
            .eq('id', companyId);

        if (dbError) {
            console.error("Erro DB Admin:", dbError);
            throw dbError;
        }

        return NextResponse.redirect(new URL('/admin/integrations?success=mp_connected', request.url));

    } catch (error) {
        console.error("Erro crítico:", error);
        return NextResponse.redirect(new URL('/admin/integrations?error=server_error', request.url));
    }
}