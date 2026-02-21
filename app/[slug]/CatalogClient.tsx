"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Clock, Bike, User, ChevronLeft, ShoppingBag, CreditCard, Phone, Loader2, Home, Plus, ChevronRight, Minus, Search, Banknote } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PixModal from "@/components/PixModal"; // Import do Pix que adicionamos antes!

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

function CatalogHeader({ company, isOpenNow, userDistance }: { company: any, isOpenNow: boolean, userDistance: string | null }) {
    if (!company) return null;
    
    const baseFee = company.delivery_rules?.baseFee ? Number(company.delivery_rules.baseFee) : 5.00;
    const categoryName = company.store_category || 'Adega e Bebidas';

    return (
        <section className="bg-white relative pb-6 shadow-sm border-b border-gray-100">
            <div className="relative h-40 md:h-52 w-full bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url(${company.banner_url || 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56'})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            
            <div className="max-w-3xl mx-auto px-4 relative -mt-12 flex items-end justify-between z-10">
                <div className="flex items-end gap-4">
                    <img src={company.logo_url || "https://images.unsplash.com/photo-1563223771-5fe4038fbfc9"} className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover bg-white" alt="Logo" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-3">
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">{company.name}</h1>
                    <span className={`text-[10px] font-bold px-2 py-1 uppercase rounded-md flex items-center gap-1.5 ${isOpenNow ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {isOpenNow ? 'Aberto' : 'Fechado'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mt-2">
                    <span className="flex items-center gap-1 text-yellow-500 font-bold"><Star className="w-4 h-4 fill-yellow-500"/> 4.9</span>
                    <span className="text-gray-400">(500+)</span>
                    <span className="text-gray-300">•</span>
                    <span>{categoryName}</span>
                    <span className="text-gray-300">•</span>
                    <span>{userDistance ? `${userDistance} km` : '...'}</span>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm font-medium text-gray-600">
                    {/* Previsão alterada de mock fixo para status dinâmico */}
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400"/> 
                        {isOpenNow ? "Entrega" : "Indisponível"}
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-600"><Bike className="w-4 h-4 text-blue-500"/> Frete a partir de R$ {baseFee.toFixed(2).replace('.', ',')}</div>
                </div>
            </div>
        </section>
    );
}

function ProductCard({ product, onAdd, onRemove, cartItem, isOpen }: any) {
    return (
        <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 transition-opacity ${!isOpen ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-gray-800 leading-tight">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
                </div>
                <span className="font-bold text-[15px] text-gray-900 mt-4">R$ {Number(product.price).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex flex-col items-center justify-between w-24">
                <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shadow-sm">
                    {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover" alt={product.name} /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sem foto</div>}
                </div>
                <div className="mt-3 w-full">
                    {cartItem ? (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 p-1">
                            <button onClick={onRemove} className="p-1 text-gray-600 hover:text-red-500 transition"><Minus size={16} /></button>
                            <span className="font-bold text-gray-800 text-sm">{cartItem.quantity}</span>
                            <button onClick={onAdd} className="p-1 text-blue-600 hover:text-blue-700 transition"><Plus size={16} /></button>
                        </div>
                    ) : (
                        <button onClick={onAdd} disabled={!isOpen} className="w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-1.5 rounded-lg transition text-sm disabled:opacity-50 shadow-sm">
                            Adicionar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CartDrawer({ isOpen, onClose, cart, company, onSuccess }: any) {
    const [step, setStep] = useState<"IDENTIFICATION" | "ADDRESS" | "CONFIRMATION">("IDENTIFICATION");
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
    
    const [phone, setPhone] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [needsName, setNeedsName] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

    const [isAddingAddress, setIsAddingAddress] = useState(true);
    const [selectedAddressObj, setSelectedAddressObj] = useState<any>(null);
    const [cep, setCep] = useState("");
    const [street, setStreet] = useState("");
    const [number, setNumber] = useState("");
    const [neighborhood, setNeighborhood] = useState("");
    const [city, setCity] = useState("");
    const [complement, setComplement] = useState("");

    const [paymentMethod, setPaymentMethod] = useState("PIX");
    const [changeFor, setChangeFor] = useState("");
    const [calculatedFee, setCalculatedFee] = useState(0);

    const [isPixModalOpen, setIsPixModalOpen] = useState(false);
    const [pixData, setPixData] = useState<any>(null);

    const subtotal = cart.reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0);
    const total = subtotal + calculatedFee;

    const handleIdentify = async () => {
        if (phone.length < 10) return alert("WhatsApp inválido.");
        if (needsName) {
            if (customerName.length < 3) return alert("Por favor, informe seu nome.");
            setStep("ADDRESS");
            return;
        }

        setIsSearching(true);
        const { data: customer } = await supabase.from('Customer').select('*').eq('company_id', company.id).eq('phone', phone).single();
        if (customer) {
            setCustomerName(customer.name);
            setSavedAddresses(customer.saved_addresses || []);
            if (customer.saved_addresses?.length > 0) setIsAddingAddress(false);
            setStep("ADDRESS");
        } else {
            setNeedsName(true);
        }
        setIsSearching(false);
    };

    // TROCADO VIACEP POR AWESOMEAPI PARA EVITAR 429 TOO MANY REQUESTS
    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        setCep(val);
        if(val.length === 8) {
             try {
                const res = await fetch(`https://cep.awesomeapi.com.br/json/${val}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                
                setStreet(data.address || "");
                setNeighborhood(data.district || "");
                setCity(data.city || "");
             } catch (error) {
                // Fallback silencioso se falhar
                console.error("Erro ao buscar CEP");
             }
        }
    };

    const processDeliveryFee = async (addrObj: any) => {
        const rules = company.delivery_rules || { baseKm: 5, baseFee: 5, extraFee: 8 };

        if (!company.lat || !company.lng) {
            setCalculatedFee(Number(rules.baseFee));
            setStep("CONFIRMATION");
            return;
        }

        setIsCalculatingDistance(true);
        try {
            let cLat = null;
            let cLng = null;

            if (addrObj.cep) {
                const cepRes = await fetch(`https://cep.awesomeapi.com.br/json/${addrObj.cep.replace(/\D/g, '')}`);
                const cepData = await cepRes.json();
                if (cepData && cepData.lat && cepData.lng) {
                    cLat = parseFloat(cepData.lat);
                    cLng = parseFloat(cepData.lng);
                }
            }

            if (cLat && cLng) {
                const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${company.lng},${company.lat};${cLng},${cLat}?overview=false`);
                const osrmData = await osrmRes.json();
                
                if(osrmData.code === 'Ok' && osrmData.routes.length > 0) {
                    const distanceKm = osrmData.routes[0].distance / 1000;
                    if (distanceKm <= Number(rules.baseKm)) {
                        setCalculatedFee(Number(rules.baseFee));
                    } else {
                        setCalculatedFee(Number(rules.extraFee));
                    }
                } else {
                    setCalculatedFee(Number(rules.extraFee));
                }
            } else {
                setCalculatedFee(Number(rules.extraFee)); 
            }
        } catch (err) {
            setCalculatedFee(Number(rules.baseFee));
        }
        setIsCalculatingDistance(false);
        setStep("CONFIRMATION");
    };

    const handleAddressContinue = () => {
        if (isAddingAddress) {
            if (!street || !number || !neighborhood) return alert("Preencha rua, número e bairro.");
            const newAddr = { street, number, neighborhood, complement, cep, city };
            setSelectedAddressObj(newAddr);
            processDeliveryFee(newAddr);
        } else {
            processDeliveryFee(selectedAddressObj);
        }
    };

    const handleFinish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let finalAddresses = savedAddresses;
            if (isAddingAddress) finalAddresses = [...savedAddresses, selectedAddressObj];

            await supabase.from('Customer').upsert({
                company_id: company.id, name: customerName, phone: phone, saved_addresses: finalAddresses
            }, { onConflict: 'company_id, phone' });

            const fullAddress = `${selectedAddressObj.street}, ${selectedAddressObj.number} - ${selectedAddressObj.neighborhood} ${selectedAddressObj.complement ? '('+selectedAddressObj.complement+')' : ''}`;

            const { data: order, error: orderError } = await supabase
                .from('Order').insert([{
                    company_id: company.id, 
                    customer_name: customerName, 
                    customer_phone: phone, 
                    total_price: total,
                    status: 'pending', 
                    payment_status: 'unpaid',
                    address_details: { address: fullAddress, paymentMethod, changeFor: paymentMethod === 'DINHEIRO' ? changeFor : null, deliveryFee: calculatedFee }
                }]).select().single();

            if (orderError) throw orderError;

            const itemsToInsert = cart.map((item: any) => ({
                order_id: order.id, product_id: item.id, quantity: item.quantity, unit_price: item.price
            }));
            
            const { error: itemsError } = await supabase.from('OrderItem').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            if (paymentMethod === 'PIX') {
                const pixRes = await fetch('/api/payments/pix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.id,
                        companyId: company.id,
                        total: total
                    })
                });
                
                const pixInfo = await pixRes.json();
                if (!pixRes.ok) throw new Error(pixInfo.error || "Erro ao gerar Pix");
                
                setPixData(pixInfo);
                setIsPixModalOpen(true);
            } else {
                onSuccess();
            }

        } catch (error: any) {
            console.error(error);
            alert(error.message || "Erro ao finalizar pedido.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="absolute inset-x-0 bottom-0 bg-[#f7f7f7] rounded-t-[32px] h-[92vh] flex flex-col md:max-w-3xl md:mx-auto shadow-2xl">
                
                <div className="bg-white px-6 py-4 flex items-center justify-between border-b shrink-0 rounded-t-[32px]">
                    <button onClick={() => step === "IDENTIFICATION" ? onClose() : step === "CONFIRMATION" ? setStep("ADDRESS") : setStep("IDENTIFICATION")} className="p-2 -ml-2 text-gray-400"><ChevronLeft size={24} /></button>
                    <h2 className="text-lg font-bold text-gray-900">Finalizar Pedido</h2>
                    <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-3"><ShoppingBag size={20} className="text-gray-400" /> Sua Sacola</h3>
                        {cart.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-sm mb-3">
                                <div className="flex gap-3"><span className="font-bold text-gray-400">{item.quantity}x</span><span className="font-medium text-gray-900">{item.name}</span></div>
                                <span className="font-semibold text-gray-900">R$ {(Number(item.price) * item.quantity).toFixed(2).replace('.', ',')}</span>
                            </div>
                        ))}
                    </div>

                    {step === "IDENTIFICATION" && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border text-center space-y-4">
                            <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-blue-600"><Phone size={28} /></div>
                            <h3 className="text-xl font-bold text-gray-900">Para começar...</h3>
                            <input type="tel" placeholder="(00) 00000-0000" disabled={needsName} className="w-full bg-gray-50 border rounded-xl p-4 text-center text-xl font-bold outline-none" value={phone} onChange={e => setPhone(e.target.value)} />
                            {needsName && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 mt-4">
                                    <p className="text-sm text-gray-500 text-left font-medium">Você é novo por aqui! Como se chama?</p>
                                    <input type="text" placeholder="Seu nome completo" className="w-full bg-gray-50 border rounded-xl p-4 outline-none" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                                </motion.div>
                            )}
                        </div>
                    )}

                    {step === "ADDRESS" && (
                        <div className="space-y-4">
                            {!isAddingAddress && savedAddresses.length > 0 ? (
                                <>
                                    <h3 className="font-bold text-gray-800 px-2">Onde entregamos?</h3>
                                    {savedAddresses.map((addr, idx) => (
                                        <button key={idx} onClick={() => { setSelectedAddressObj(addr); setStep("CONFIRMATION"); processDeliveryFee(addr); }} className="w-full bg-white p-4 rounded-2xl border flex items-center gap-4 text-left">
                                            <div className="bg-gray-100 p-3 rounded-xl text-gray-500"><Home size={20} /></div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{addr.street}, {addr.number}</p>
                                                <p className="text-xs text-gray-500">{addr.neighborhood}</p>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300" />
                                        </button>
                                    ))}
                                    <button onClick={() => setIsAddingAddress(true)} className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl text-blue-600 font-bold flex items-center justify-center gap-2">
                                        <Plus size={20} /> Novo Endereço
                                    </button>
                                </>
                            ) : (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={18} /> Novo Endereço</h3>
                                        {savedAddresses.length > 0 && <button onClick={() => setIsAddingAddress(false)} className="text-xs text-blue-600 font-bold hover:underline">Ver salvos</button>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" placeholder="CEP" className="col-span-2 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={cep} onChange={handleCepChange} maxLength={8} />
                                        <input type="text" placeholder="Rua / Avenida" className="col-span-2 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={street} onChange={e => setStreet(e.target.value)} />
                                        <input type="text" placeholder="Número" className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={number} onChange={e => setNumber(e.target.value)} />
                                        <input type="text" placeholder="Bairro" className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                                        <input type="text" placeholder="Complemento" className="col-span-2 p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={complement} onChange={e => setComplement(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === "CONFIRMATION" && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border">
                            <h3 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2"><CreditCard size={18} /> Pagamento na Entrega</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {['PIX', 'DINHEIRO', 'CARTAO'].map(m => (
                                    <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`py-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${paymentMethod === m ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white text-gray-500'}`}>
                                        {m === 'DINHEIRO' ? <Banknote className="w-5 h-5" /> : m === 'CARTAO' ? <CreditCard className="w-5 h-5" /> : <div className="font-extrabold font-serif text-lg leading-none">P</div>}
                                        {m}
                                    </button>
                                ))}
                            </div>
                            {paymentMethod === 'DINHEIRO' && (
                                <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                    <label className="text-sm font-bold text-orange-900">Precisa de troco para quanto?</label>
                                    <input type="number" placeholder="Ex: 50,00" className="w-full mt-2 p-3 bg-white border border-orange-200 rounded-lg outline-none" value={changeFor} onChange={e => setChangeFor(e.target.value)} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <div className="flex flex-col">
                            {step === "CONFIRMATION" && <span className="text-gray-400 text-xs font-bold uppercase">Frete Calculado: R$ {calculatedFee.toFixed(2).replace('.', ',')}</span>}
                            <span className="text-2xl font-bold text-gray-900">R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>
                    <button
                        onClick={step === "IDENTIFICATION" ? handleIdentify : step === "ADDRESS" ? handleAddressContinue : handleFinish}
                        disabled={isSearching || isSubmitting || isCalculatingDistance}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 font-bold text-lg flex justify-center items-center shadow-lg"
                    >
                        {isSearching || isSubmitting || isCalculatingDistance ? <Loader2 className="animate-spin" /> : step === "CONFIRMATION" ? "Concluir Pedido" : "Continuar"}
                    </button>
                </div>
            </motion.div>

            <PixModal 
                isOpen={isPixModalOpen} 
                onClose={() => {
                    setIsPixModalOpen(false);
                    onSuccess();
                }} 
                pixData={pixData} 
            />
        </div>
    );
}

export default function CatalogClient({ company, categories, products }: { company: any, categories: any[], products: any[] }) {
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [userDistance, setUserDistance] = useState<string | null>(null);
    
    const [isClient, setIsClient] = useState(false);
    const [isOpenNow, setIsOpenNow] = useState(true);

    const checkIsOpen = () => {
        if(!company?.business_hours || Object.keys(company.business_hours).length === 0) return true; 
        
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        const rule = company.business_hours[today];
        
        if(!rule || !rule.isOpen) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [openH, openM] = rule.open.split(':').map(Number);
        const openTime = openH * 60 + openM;
        
        const [closeH, closeM] = rule.close.split(':').map(Number);
        const closeTime = closeH * 60 + closeM;

        return currentTime >= openTime && currentTime <= closeTime;
    };

    useEffect(() => {
        setIsClient(true);
        setIsOpenNow(checkIsOpen());

        if (company?.lat && company?.lng && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const dist = getDistanceFromLatLonInKm(
                        company.lat, 
                        company.lng, 
                        position.coords.latitude, 
                        position.coords.longitude
                    );
                    setUserDistance(dist.toFixed(1));
                },
                (err) => console.log("Sem permissão de GPS")
            );
        }
    }, [company]);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === productId);
            if (existing && existing.quantity > 1) return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
            return prev.filter(item => item.id !== productId);
        });
    };

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0);
    const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const handleSuccess = () => {
        setIsCartOpen(false);
        setCart([]);
        alert("Pedido realizado com sucesso!");
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupedProducts = categories.map(cat => ({
        ...cat,
        items: filteredProducts.filter(p => p.category_id === cat.id)
    })).filter(cat => cat.items.length > 0);

    const orphanProducts = filteredProducts.filter(p => !p.category_id);

    if (!isClient) return null; 

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
            <CatalogHeader company={company} isOpenNow={isOpenNow} userDistance={userDistance} />

            <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar bebida, petisco..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                {groupedProducts.length > 0 && !searchTerm && (
                    <div className="max-w-3xl mx-auto px-2 pb-3 flex overflow-x-auto no-scrollbar gap-2">
                        {groupedProducts.map(cat => (
                            <a 
                                key={cat.id}
                                href={`#cat-${cat.id}`}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {cat.name}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <main className="max-w-3xl mx-auto px-4 py-6">
                {!isOpenNow && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-center shadow-sm">
                        <h3 className="font-bold text-lg mb-1">Estamos Fechados 😴</h3>
                        <p className="text-sm">Não estamos recebendo pedidos no momento. Confira nosso horário de funcionamento.</p>
                    </div>
                )}
                
                <div className="flex flex-col gap-8">
                    {groupedProducts.map((category) => (
                        <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-36">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">{category.name}</h2>
                            <div className="flex flex-col gap-4">
                                {category.items.map((product: any) => (
                                    <ProductCard 
                                        key={product.id} product={product} isOpen={isOpenNow}
                                        cartItem={cart.find((item) => item.id === product.id)}
                                        onAdd={() => addToCart(product)} onRemove={() => removeFromCart(product.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {orphanProducts.length > 0 && (
                        <div className="scroll-mt-36">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Outros Itens</h2>
                            <div className="flex flex-col gap-4">
                                {orphanProducts.map((product: any) => (
                                    <ProductCard 
                                        key={product.id} product={product} isOpen={isOpenNow}
                                        cartItem={cart.find((item) => item.id === product.id)}
                                        onAdd={() => addToCart(product)} onRemove={() => removeFromCart(product.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredProducts.length === 0 && (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                            Nenhum produto encontrado.
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {cartItemsCount > 0 && !isCartOpen && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-0 right-0 px-4 z-20">
                        <button onClick={() => setIsCartOpen(true)} className="max-w-3xl mx-auto w-full bg-blue-600 text-white p-4 rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center justify-between font-bold">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-2"><ShoppingBag className="w-5 h-5" /><span>{cartItemsCount}</span></div>
                                <span>Ver Sacola</span>
                            </div>
                            <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCartOpen && <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} company={company} onSuccess={handleSuccess} />}
            </AnimatePresence>
        </div>
    );
}