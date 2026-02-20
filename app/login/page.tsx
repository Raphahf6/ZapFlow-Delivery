"use client";

import React, { useState } from "react";
import { Store, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import correto do Next.js
import { supabase } from "@/lib/supabase"; // Import da nossa lib configurada

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message || "E-mail ou senha incorretos.");
                return;
            }

            // Redireciona para o admin após o login
            router.push(`/admin/dashboard`);

        } catch (err) {
            setError("Erro inesperado ao conectar com o serviço de autenticação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans text-gray-900">
            {/* LADO ESQUERDO - Formulário de Login */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-24 lg:px-32 relative">
                <div className="absolute top-8 left-8 md:left-24 lg:left-32 flex items-center gap-2 text-blue-600 font-bold text-xl">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    ZapFlow
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full mx-auto mt-16 lg:mt-0"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h1>
                    <p className="text-gray-500 mb-8">Acesse seu painel para gerenciar seus pedidos e faturamento.</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">E-mail corporativo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="voce@empresa.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">Senha</label>
                                <Link href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold text-base flex justify-center items-center gap-2 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70 mt-4 shadow-lg shadow-blue-600/30"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Acessar Painel <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                        Ainda não é parceiro? <Link href="/register" className="text-blue-600 font-bold hover:underline">Crie sua loja grátis</Link>
                    </p>
                </motion.div>
            </div>

            {/* LADO DIREITO - Banner Institucional */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

                <div className="relative z-10 max-w-lg text-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-6 backdrop-blur-sm">
                        <ShieldCheck className="w-4 h-4 text-blue-200" />
                        Sistema Seguro
                    </div>
                    <h2 className="text-4xl font-bold mb-6 leading-tight">
                        Gerencie seu delivery no piloto automático.
                    </h2>
                    <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                        Tenha seu catálogo digital, cardápio com QR Code, funil de vendas e recebimento de pedidos integrados com o WhatsApp da sua loja.
                    </p>

                    <div className="w-full h-64 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md p-6 shadow-2xl">
                        <div className="flex gap-3 mb-4">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-4 bg-white/20 rounded w-3/4"></div>
                            <div className="h-4 bg-white/20 rounded w-1/2"></div>
                            <div className="h-4 bg-white/20 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}