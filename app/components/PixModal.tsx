"use client";

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle2, Loader2, X } from 'lucide-react';

interface PixModalProps {
    isOpen: boolean;
    onClose: () => void;
    pixData: {
        copy_paste: string;
        qr_code_base64: string;
    } | null;
}

export default function PixModal({ isOpen, onClose, pixData }: PixModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !pixData) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(pixData.copy_paste);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 text-center space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="w-8" />
                        <h3 className="font-extrabold text-xl text-gray-900">Pagamento Pix</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <p className="text-sm text-gray-500">Escaneie o código abaixo ou use o Copia e Cola para pagar.</p>
                    
                    {/* Renderização do QRCode */}
                    <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200 inline-block mx-auto">
                        <img 
                            src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} 
                            alt="QR Code Pix"
                            className="w-48 h-48 mx-auto"
                        />
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleCopy}
                            className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'}`}
                        >
                            {copied ? (
                                <><CheckCircle2 className="w-5 h-5" /> Código Copiado!</>
                            ) : (
                                <><Copy className="w-5 h-5" /> Copiar Código Pix</>
                            )}
                        </button>
                        
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                            O pedido será confirmado após o pagamento
                        </p>
                    </div>
                </div>
                
                <div className="bg-gray-50 p-4 text-center border-t">
                    <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-700">
                        Já realizei o pagamento
                    </button>
                </div>
            </div>
        </div>
    );
}