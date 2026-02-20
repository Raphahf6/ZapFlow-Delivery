export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  whatsapp_number?: string;
  mp_access_token?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  in_stock: boolean;
}

export interface Order {
  id: string;
  company_id: string;
  customer_name: string;
  customer_phone: string;
  total_price: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  payment_status: 'unpaid' | 'paid';
  created_at: string;
}