import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializando o cliente Supabase. 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        // Como o seu sistema tem a tabela Company, precisamos saber de qual empresa
        // estamos buscando os dados do dashboard. 
        // Aqui pegamos o company_id da URL (ex: /api/dashboard?companyId=123-456-789)
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId');

        if (!companyId) {
            return NextResponse.json(
                { error: "O ID da empresa (companyId) é obrigatório." },
                { status: 400 }
            );
        }

        // 1. Definindo os limites do dia de hoje para realizar o filtro no banco
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const inicioHoje = hoje.toISOString();

        const fimHoje = new Date();
        fimHoje.setHours(23, 59, 59, 999);
        const fimDia = fimHoje.toISOString();

        // 2. Buscando os pedidos de hoje na tabela 'Order' para a empresa específica
        const { data: vendas, error: erroVendas } = await supabase
            .from('Order')
            .select('id, total_price, status, customer_name')
            .eq('company_id', companyId)
            .neq('status', 'cancelled') // <--- ISSO IGNORA OS CANCELADOS NO CALCULO
            .gte('created_at', inicioHoje)
            .lte('created_at', fimDia);

        if (erroVendas) {
            console.error("Erro ao buscar vendas no Supabase:", erroVendas);
            throw new Error('Falha ao buscar vendas');
        }

        // 3. Processando os valores retornados (usando total_price do seu schema)
        const vendasHoje = vendas?.reduce((total, pedido) => total + (Number(pedido.total_price) || 0), 0) || 0;
        const pedidosHoje = vendas?.length || 0;

        // 4. Buscando novos clientes cadastrados hoje na tabela 'Customer'
        const { count: novosClientes, error: erroClientes } = await supabase
            .from('Customer')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .gte('created_at', inicioHoje)
            .lte('created_at', fimDia);

        if (erroClientes) {
            console.error("Erro ao contar clientes no Supabase:", erroClientes);
            throw new Error('Falha ao contar clientes');
        }

        // 5. Buscando os últimos 5 pedidos em geral (para a lista inferior do dashboard)
        const { data: ultimosPedidosData, error: erroUltimosPedidos } = await supabase
            .from('Order')
            .select('id, customer_name, total_price, status')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (erroUltimosPedidos) {
            console.error("Erro ao buscar últimos pedidos no Supabase:", erroUltimosPedidos);
            throw new Error('Falha ao buscar últimos pedidos');
        }

        // 6. Formatando os pedidos para o modelo que o componente React espera
        const ultimosPedidosFormatados = ultimosPedidosData?.map((pedido) => ({
            id: String(pedido.id).substring(0, 8), // Pegando os primeiros 8 caracteres do UUID para ficar bonito na tela
            cliente: pedido.customer_name || 'Cliente não identificado',
            valor: Number(pedido.total_price) || 0,
            status: pedido.status || 'pending'
        })) || [];

        // 7. Montando o payload final dinâmico
        const dashboardData = {
            vendasHoje,
            pedidosHoje,
            novosClientes: novosClientes || 0,
            conversao: 8.5, // Fixo por enquanto, até termos uma tabela de Analytics/Visitas
            ultimosPedidos: ultimosPedidosFormatados
        };

        return NextResponse.json(dashboardData, { status: 200 });

    } catch (error) {
        console.error("Erro crítico na API de dashboard:", error);
        return NextResponse.json(
            { error: "Falha ao processar os dados do Supabase" },
            { status: 500 }
        );
    }
}