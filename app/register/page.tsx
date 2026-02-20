"use client";

import React, { useState } from "react";
import { Store, Mail, Lock, Loader2, ArrowRight, User } from "lucide-react";
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // 1. Criar usuário no Auth do Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Criar a Empresa vinculada (Tabela Company)
                const { error: companyError } = await supabase
                    .from('Company')
                    .insert([
                        { 
                            name: storeName, 
                            slug: storeName.toLowerCase().replace(/ /g, '-'),
                            is_active: true 
                        }
                    ]);

                if (companyError) throw companyError;
                
                setSuccess(true);
                // Opcional: Redirecionar após alguns segundos ou pedir para validar e-mail
            }

        } catch (err: any) {
            setError(err.message || "Erro ao criar conta.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                    <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Conta criada com sucesso!</h2>
                    <p className="text-gray-600 mb-6">Verifique seu e-mail para confirmar o cadastro e começar a configurar sua adega.</p>
                    <Link href="/login" className="text-blue-600 font-bold hover:underline">Ir para o Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white font-sans text-gray-900">
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
                    className="max-w-md w-full mx-auto"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Comece grátis</h1>
                    <p className="text-gray-500 mb-8">Crie sua conta e automatize seu negócio em minutos.</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Nome da Adega/Loja</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Store className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Adega do Centro"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">E-mail</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="voce@email.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
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
                                <>Criar Minha Loja <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500 font-medium">
                        Já tem uma conta? <Link href="/login" className="text-blue-600 font-bold hover:underline">Fazer login</Link>
                    </p>
                </motion.div>
            </div>
            {/* ... o lado direito pode ser o mesmo do login ou outra imagem ... */}
        </div>
    );
}