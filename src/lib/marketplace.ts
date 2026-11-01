import { supabase } from '@/lib/supabaseClient';

export const PLATFORM_COMMISSION_PERCENT = 10;

export type ProductCategory = 'cacao' | 'cafe' | 'arroz' | 'frutas' | 'hortalizas' | 'otros';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'cacao', label: 'Cacao' },
  { value: 'cafe', label: 'Café' },
  { value: 'arroz', label: 'Arroz' },
  { value: 'frutas', label: 'Frutas' },
  { value: 'hortalizas', label: 'Hortalizas' },
  { value: 'otros', label: 'Otros' },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  category: ProductCategory;
  unit: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductInput {
  name: string;
  description: string;
  category: ProductCategory;
  unit: string;
  price: number;
  stock: number;
  is_active: boolean;
}

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  commission_rate: number;
  commission: number;
  buyer_name: string;
  buyer_phone: string;
  delivery_note: string;
  status: OrderStatus;
  created_at: string;
}

export interface PlaceOrderInput {
  productId: string;
  quantity: number;
  buyerName: string;
  buyerPhone: string;
  deliveryNote: string;
}

const PRODUCT_COLUMNS = 'id, seller_id, name, description, category, unit, price, stock, is_active, created_at';
const ORDER_COLUMNS = 'id, buyer_id, seller_id, product_id, product_name, quantity, unit, unit_price, total, commission_rate, commission, buyer_name, buyer_phone, delivery_note, status, created_at';

function toProduct(row: Record<string, unknown>): MarketplaceProduct {
  return {
    id: String(row.id),
    seller_id: String(row.seller_id),
    name: String(row.name),
    description: String(row.description ?? ''),
    category: row.category as ProductCategory,
    unit: String(row.unit),
    price: Number(row.price),
    stock: Number(row.stock),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
  };
}

function toOrder(row: Record<string, unknown>): MarketplaceOrder {
  return {
    id: String(row.id),
    buyer_id: String(row.buyer_id),
    seller_id: String(row.seller_id),
    product_id: row.product_id ? String(row.product_id) : null,
    product_name: String(row.product_name),
    quantity: Number(row.quantity),
    unit: String(row.unit),
    unit_price: Number(row.unit_price),
    total: Number(row.total),
    commission_rate: Number(row.commission_rate),
    commission: Number(row.commission),
    buyer_name: String(row.buyer_name),
    buyer_phone: String(row.buyer_phone),
    delivery_note: String(row.delivery_note ?? ''),
    status: row.status as OrderStatus,
    created_at: String(row.created_at),
  };
}

export async function fetchStoreProducts(userId: string): Promise<MarketplaceProduct[]> {
  const { data, error } = await supabase
    .from('marketplace_products')
    .select(PRODUCT_COLUMNS)
    .eq('is_active', true)
    .neq('seller_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toProduct(row as Record<string, unknown>));
}

export async function fetchMyProducts(userId: string): Promise<MarketplaceProduct[]> {
  const { data, error } = await supabase
    .from('marketplace_products')
    .select(PRODUCT_COLUMNS)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toProduct(row as Record<string, unknown>));
}

export async function createProduct(input: ProductInput): Promise<void> {
  const { error } = await supabase.from('marketplace_products').insert(input);
  if (error) throw error;
}

export async function updateProduct(productId: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from('marketplace_products').update(input).eq('id', productId);
  if (error) throw error;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('marketplace_products').delete().eq('id', productId);
  if (error) throw error;
}

export async function fetchMyOrders(): Promise<MarketplaceOrder[]> {
  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(ORDER_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toOrder(row as Record<string, unknown>));
}

export async function placeOrder(input: PlaceOrderInput): Promise<void> {
  const { error } = await supabase.rpc('place_marketplace_order', {
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_buyer_name: input.buyerName,
    p_buyer_phone: input.buyerPhone,
    p_delivery_note: input.deliveryNote,
  });
  if (error) throw error;
}

export async function changeOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.rpc('set_marketplace_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw error;
}

const KNOWN_ERRORS: { match: string; message: string }[] = [
  { match: 'Not enough stock', message: 'No hay suficiente stock para esa cantidad.' },
  { match: 'Product is not available', message: 'Este producto ya no está disponible.' },
  { match: 'cannot buy your own', message: 'No puedes comprar tu propio producto.' },
  { match: 'Invalid quantity', message: 'La cantidad debe estar entre 1 y 1000.' },
  { match: 'Invalid status change', message: 'Ese cambio de estado no está permitido.' },
  { match: 'Order not found', message: 'No encontramos este pedido.' },
];

export function marketplaceErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : '';
  const known = KNOWN_ERRORS.find((entry) => raw.includes(entry.match));
  return known ? known.message : 'No pudimos completar la operación. Intenta de nuevo.';
}

export function commissionFor(total: number): number {
  return Math.round(total * PLATFORM_COMMISSION_PERCENT) / 100;
}

export function formatMoney(value: number): string {
  return value.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
