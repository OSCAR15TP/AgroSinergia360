import { useState } from 'react';
import { Alert } from '@/components/Alert';
import { changeOrderStatus, formatMoney, marketplaceErrorMessage, ORDER_STATUS_LABELS, PLATFORM_COMMISSION_PERCENT, type MarketplaceOrder, type OrderStatus } from '@/lib/marketplace';
import { formatDate } from '@/hooks/useAppData';

interface OrderListProps {
  orders: MarketplaceOrder[];
  perspective: 'buyer' | 'seller';
  onChanged: () => void;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-harvest-100 text-harvest-800',
  confirmed: 'bg-sky-100 text-sky-800',
  delivered: 'bg-grove-100 text-grove-800',
  cancelled: 'bg-earth-200 text-earth-600',
};

function actionsFor(order: MarketplaceOrder, perspective: 'buyer' | 'seller'): { status: OrderStatus; label: string; tone: string }[] {
  if (perspective === 'buyer') {
    return order.status === 'pending' ? [{ status: 'cancelled', label: 'Cancelar pedido', tone: 'text-clay-700 hover:bg-clay-50' }] : [];
  }
  const cancel = { status: 'cancelled' as const, label: 'Cancelar', tone: 'text-clay-700 hover:bg-clay-50' };
  if (order.status === 'pending') {
    return [{ status: 'confirmed', label: 'Confirmar', tone: 'bg-grove-600 text-white hover:bg-grove-700' }, cancel];
  }
  if (order.status === 'confirmed') {
    return [{ status: 'delivered', label: 'Marcar entregado', tone: 'bg-grove-600 text-white hover:bg-grove-700' }, cancel];
  }
  return [];
}

export function OrderList({ orders, perspective, onChanged }: OrderListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatus = async (orderId: string, status: OrderStatus) => {
    setBusyId(orderId);
    setError(null);
    try {
      await changeOrderStatus(orderId, status);
      onChanged();
    } catch (cause) {
      console.error('order status change failed', cause);
      setError(marketplaceErrorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && <Alert type="danger">{error}</Alert>}
      {orders.map((order) => (
        <div key={order.id} className="card p-4 animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-earth-900 truncate">{order.product_name}</h4>
              <p className="text-xs text-earth-500 mt-0.5">
                {formatDate(order.created_at.slice(0, 10))} · {order.quantity} {order.unit}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="text-earth-500">Total</div>
            <div className="text-right font-semibold text-earth-900">{formatMoney(order.total)}</div>
            {perspective === 'seller' && (
              <>
                <div className="text-earth-500">Comisión de la plataforma ({PLATFORM_COMMISSION_PERCENT}%)</div>
                <div className="text-right text-earth-700">- {formatMoney(order.commission)}</div>
                <div className="text-earth-500">Tu ganancia</div>
                <div className="text-right font-semibold text-grove-700">{formatMoney(order.total - order.commission)}</div>
              </>
            )}
          </div>

          <div className="mt-3 rounded-lg bg-earth-50 p-3 text-xs text-earth-600 space-y-0.5">
            <p><span className="font-semibold text-earth-700">Contacto:</span> {order.buyer_name} · {order.buyer_phone}</p>
            {order.delivery_note && <p><span className="font-semibold text-earth-700">Entrega:</span> {order.delivery_note}</p>}
            <p>Pago en efectivo o transferencia, acordado directamente entre comprador y vendedor.</p>
          </div>

          {actionsFor(order, perspective).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actionsFor(order, perspective).map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatus(order.id, action.status)}
                  disabled={busyId === order.id}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${action.tone}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
