import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const companyId = searchParams.get('state'); // O state que enviamos no handleConnectMP

    // 1. Validação básica
    if (!code || !companyId) {
        console.error("Callback MP: Código ou CompanyId ausentes", { code, companyId });
        return NextResponse.redirect(new URL('/admin/integrations?error=invalid_params', request.url));
    }

    try {
        // 2. Troca o código pelo Access Token
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
            console.error("Erro na troca de token MP:", data);
            return NextResponse.redirect(new URL('/admin/integrations?error=mp_token_exchange_failed', request.url));
        }

        // 3. SALVAR NO SUPABASE
        // Importante: Usamos o companyId que veio no 'state'
        const { error: dbError } = await supabase
            .from('Company')
            .update({ 
                mp_access_token: data.access_token 
            })
            .eq('id', companyId);

        if (dbError) {
            console.error("Erro ao salvar token no banco:", dbError);
            return NextResponse.redirect(new URL('/admin/integrations?error=db_save_failed', request.url));
        }

        // 4. Sucesso!
        return NextResponse.redirect(new URL('/admin/integrations?success=mp_connected', request.url));

    } catch (error) {
        console.error("Erro crítico no callback MP:", error);
        return NextResponse.redirect(new URL('/admin/integrations?error=server_error', request.url));
    }
}