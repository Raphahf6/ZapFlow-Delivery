import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import CatalogClient from "./CatalogClient";

export const dynamic = 'force-dynamic';

export default async function PublicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // 1. Buscar a empresa
    const { data: company } = await supabase
        .from("Company")
        .select("*")
        .eq("slug", slug)
        .single();

    if (!company) notFound();

    // 2. Buscar as Categorias da empresa
    const { data: categories } = await supabase
        .from("Category")
        .select("*")
        .eq("company_id", company.id)
        .order('created_at', { ascending: true });

    // 3. Buscar os Produtos
    const { data: products } = await supabase
        .from("Product")
        .select("*")
        .eq("company_id", company.id)
        .eq("in_stock", true);

    return <CatalogClient company={company} categories={categories || []} products={products || []} />;
}