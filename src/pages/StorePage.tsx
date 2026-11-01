import { useCallback, useEffect, useState } from 'react';
import { Alert } from '@/components/Alert';
import { EmptyState } from '@/components/UI';
import { TabButton } from '@/components/TabButton';
import { OrderList } from '@/components/marketplace/OrderList';
import { PlaceOrderModal } from '@/components/marketplace/PlaceOrderModal';
import {
  fetchMyOrders,
  fetchStoreProducts,
  formatMoney,
  PRODUCT_CATEGORIES,
  type MarketplaceOrder,
  type MarketplaceProduct,
} from '@/lib/marketplace';
import { Store, ShoppingBag, Package } from 'lucide-react';

type Tab = 'products' | 'purchases';

interface StorePageProps {
  userId: string;
}

export function StorePage({ userId }: StorePageProps) {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderProduct, setOrderProduct] = useState<MarketplaceProduct | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [productRows, orderRows] = await Promise.all([fetchStoreProducts(userId), fetchMyOrders()]);
      setProducts(productRows);
      setOrders(orderRows.filter((order) => order.buyer_id === userId));
    } catch (cause) {
      console.error('store load failed', cause);
      setLoadError('No pudimos cargar la tienda. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const categoryLabel = (value: string) => PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grove-600 text-white shadow-md">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900">Tienda</h1>
          <p className="text-sm text-earth-500">Compra productos de otros agricultores y socios</p>
        </div>
      </div>

      {loadError && <Alert type="danger">{loadError}</Alert>}
      {notice && <Alert type="success" onClose={() => setNotice(null)}>{notice}</Alert>}

      <div className="flex gap-1 rounded-xl bg-earth-100 p-1">
        <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={<ShoppingBag className="h-4 w-4" />}>Productos</TabButton>
        <TabButton active={tab === 'purchases'} onClick={() => setTab('purchases')} icon={<Package className="h-4 w-4" />}>Mis compras</TabButton>
      </div>

      {loading && <p className="text-sm text-earth-500">Cargando tienda...</p>}

      {!loading && tab === 'products' && (
        products.length === 0 ? (
          <EmptyState
            icon={<Store className="h-8 w-8" />}
            title="Aún no hay productos en la tienda"
            description="Cuando otros agricultores publiquen productos para vender, aparecerán aquí."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card p-4 flex flex-col gap-3 animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-grove-700">{categoryLabel(product.category)}</p>
                    <h3 className="text-base font-bold text-earth-900 truncate">{product.name}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock > 0 ? 'bg-grove-100 text-grove-800' : 'bg-earth-200 text-earth-600'}`}>
                    {product.stock > 0 ? `${product.stock} ${product.unit}` : 'Agotado'}
                  </span>
                </div>
                {product.description && <p className="text-sm text-earth-600 line-clamp-3">{product.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-3">
                  <p className="text-lg font-bold text-earth-900">{formatMoney(product.price)} <span className="text-sm font-normal text-earth-500">/ {product.unit}</span></p>
                  <button
                    onClick={() => setOrderProduct(product)}
                    disabled={product.stock === 0}
                    className="btn-primary text-sm py-2 disabled:opacity-50"
                  >
                    Pedir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {!loading && tab === 'purchases' && (
        orders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Aún no tienes compras"
            description="Cuando hagas un pedido desde la pestaña Productos, podrás seguirlo aquí."
          />
        ) : (
          <OrderList orders={orders} perspective="buyer" onChanged={loadAll} />
        )
      )}

      {orderProduct && (
        <PlaceOrderModal
          product={orderProduct}
          onClose={() => setOrderProduct(null)}
          onPlaced={() => {
            setNotice('Pedido enviado. El vendedor lo verá en su tienda.');
            setTab('purchases');
            loadAll();
          }}
        />
      )}
    </div>
  );
}
