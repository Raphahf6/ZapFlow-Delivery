"use client";

import React, { useState } from "react";
import { Store, Mail, Lock, Loader2, ArrowRight, CheckCircle2, TrendingUp, Zap, Users,AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [storeName, setStoreName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const router = useRouter();

    // Função robusta para criar slugs válidos para URLs
    const generateSlug = (text: string) => {
        return text
            .toString()
            .normalize("NFD") // Remove acentos
            .replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-") // Troca espaços por hífens
            .replace(/[^\w-]+/g, "") // Remove tudo que não for palavra ou hífen
            .replace(/--+/g, "-"); // Substitui múltiplos hífens por um só
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // 1. Criar usuário no Auth do Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            // Se o usuário foi criado com sucesso e temos o ID dele
            if (authData.user) {
                const cleanSlug = generateSlug(storeName);

                // 2. Criar a Empresa vinculada (Tabela Company)
                const { error: companyError } = await supabase
                    .from('Company')
                    .insert([
                        { 
                            name: storeName, 
                            slug: cleanSlug,
                            is_active: true,
                            owner_id: authData.user.id // <-- CRÍTICO PARA O RLS FUNCIONAR
                        }
                    ]);

                // 3. Tratamento de erro caso o slug já exista
                if (companyError) {
                    if (companyError.code === '23505') { // Código Postgres para violação de Unique Constraint
                        throw new Error("Já existe uma loja com este nome. Tente colocar a cidade junto (ex: Adega do João SP).");
                    }
                    throw companyError;
                }
                
                setSuccess(true);
            } else {
                 throw new Error("Não foi possível criar o usuário. Tente novamente.");
            }

        } catch (err: any) {
            console.error("Erro no registro:", err);
            // Mensagens amigáveis para erros comuns do Supabase
            if (err.message.includes("already registered")) {
                setError("Este e-mail já está cadastrado. Faça login.");
            } else {
                setError(err.message || "Erro ao criar conta.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    className="text-center p-8 bg-white rounded-[2rem] shadow-xl max-w-md w-full border border-gray-100"
                >
                    <div className="bg-green-50 text-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Quase lá!</h2>
                    <p className="text-gray-600 mb-8 font-medium">
                        Sua loja <span className="text-gray-900 font-bold">"{storeName}"</span> foi pré-configurada.<br/><br/>
                        Para garantir sua segurança, enviamos um link de confirmação para <strong className="text-gray-900">{email}</strong>. Clique nele para ativar sua conta.
                    </p>
                    <Link href="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30">
                        Ir para o Login
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white font-sans text-gray-900">
            {/* LADO ESQUERDO: FORMULÁRIO */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 lg:px-32 relative py-12">
                
                {/* Logo */}
                <div className="absolute top-8 left-8 md:left-24 lg:left-32 flex items-center gap-2 text-blue-600 font-extrabold text-xl tracking-tight">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-sm">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    ZapFlow
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full mx-auto"
                >
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Comece a faturar mais</h1>
                    <p className="text-gray-500 mb-8 font-medium">Crie seu catálogo digital gratuito e receba pedidos no WhatsApp em 2 minutos.</p>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700">Nome do seu negócio</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Store className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Adega do Centro"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700">E-mail comercial</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="voce@email.com"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.trim())}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700">Senha segura</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Mínimo de 6 caracteres"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-base flex justify-center items-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 mt-6 shadow-xl shadow-blue-600/30"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>Criar Minha Loja <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                        Já tem uma conta? <Link href="/login" className="text-blue-600 font-bold hover:underline">Fazer login</Link>
                    </p>
                </motion.div>
            </div>

            {/* LADO DIREITO: SOCIAL PROOF / FEATURES (Escondido no mobile) */}
            <div className="hidden lg:flex w-1/2 bg-gray-50 p-12 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-gray-50 to-white opacity-60"></div>
                
                <div className="relative z-10 max-w-lg space-y-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">Tudo o que sua adega precisa em um só lugar.</h2>
                        <p className="text-gray-600 font-medium text-lg leading-relaxed">Deixe as planilhas para trás. Controle vendas, clientes e produtos com uma ferramenta feita para o dono.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-start">
                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Store className="w-6 h-6" /></div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Catálogo Digital</h3>
                                <p className="text-gray-500 text-sm mt-1">Seu cardápio sempre atualizado, pronto para receber pedidos no WhatsApp.</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-start">
                            <div className="bg-green-50 p-3 rounded-2xl text-green-600"><TrendingUp className="w-6 h-6" /></div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Dashboard em Tempo Real</h3>
                                <p className="text-gray-500 text-sm mt-1">Acompanhe seu faturamento, taxa de conversão e pedidos do dia.</p>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-start">
                            <div className="bg-purple-50 p-3 rounded-2xl text-purple-600"><Users className="w-6 h-6" /></div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">CRM de Clientes</h3>
                                <p className="text-gray-500 text-sm mt-1">Saiba quem são seus melhores clientes e recupere quem não pede há tempos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}