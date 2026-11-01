import { useCallback, useEffect, useState } from 'react';
import { Alert } from '@/components/Alert';
import { EmptyState } from '@/components/UI';
import { TabButton } from '@/components/TabButton';
import { OrderList } from '@/components/marketplace/OrderList';
import { ProductFormModal } from '@/components/marketplace/ProductFormModal';
import {
  deleteProduct,
  fetchMyOrders,
  fetchMyProducts,
  formatMoney,
  marketplaceErrorMessage,
  PRODUCT_CATEGORIES,
  type MarketplaceOrder,
  type MarketplaceProduct,
} from '@/lib/marketplace';
import { Package, Pencil, Plus, Trash2, Wallet } from 'lucide-react';

type Tab = 'products' | 'orders';

interface SellerCatalogPageProps {
  userId: string;
}

export function SellerCatalogPage({ userId }: SellerCatalogPageProps) {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MarketplaceProduct | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [productRows, orderRows] = await Promise.all([fetchMyProducts(userId), fetchMyOrders()]);
      setProducts(productRows);
      setOrders(orderRows.filter((order) => order.seller_id === userId));
    } catch (cause) {
      console.error('seller catalog load failed', cause);
      setLoadError('No pudimos cargar tu tienda. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (product: MarketplaceProduct) => {
    setEditing(product);
    setShowForm(true);
  };

  const handleDelete = async (product: MarketplaceProduct) => {
    if (!window.confirm(`¿Eliminar "${product.name}" de tu tienda?`)) return;
    setActionError(null);
    try {
      await deleteProduct(product.id);
      await loadAll();
    } catch (cause) {
      console.error('product delete failed', cause);
      setActionError(marketplaceErrorMessage(cause));
    }
  };

  const categoryLabel = (value: string) => PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
  const soldTotal = orders
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + (order.total - order.commission), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-harvest-600 text-white shadow-md">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-earth-900">Mi tienda</h1>
          <p className="text-sm text-earth-500">Publica tus productos y atiende los pedidos</p>
        </div>
      </div>

      {loadError && <Alert type="danger">{loadError}</Alert>}
      {actionError && <Alert type="danger" onClose={() => setActionError(null)}>{actionError}</Alert>}

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-earth-500">Productos publicados</p>
          <p className="text-2xl font-bold text-earth-900">{products.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-1.5 text-xs text-earth-500"><Wallet className="h-3.5 w-3.5" /> Ganancia entregada</div>
          <p className="text-2xl font-bold text-grove-700">{formatMoney(soldTotal)}</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-earth-100 p-1">
        <TabButton active={tab === 'products'} onClick={() => setTab('products')}>Mis productos</TabButton>
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>Pedidos recibidos</TabButton>
      </div>

      {loading && <p className="text-sm text-earth-500">Cargando tu tienda...</p>}

      {!loading && tab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openNew} className="btn-primary text-sm py-2">
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
          </div>
          {products.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Todavía no publicas productos"
              description="Agrega lo que vendes (cacao, café, arroz u otros) con su precio y stock para que aparezca en la tienda."
            />
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="card p-4 flex items-center justify-between gap-3 animate-slide-up">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-grove-700">{categoryLabel(product.category)}{!product.is_active && ' · Oculto'}</p>
                    <h3 className="text-sm font-bold text-earth-900 truncate">{product.name}</h3>
                    <p className="text-xs text-earth-500 mt-0.5">{formatMoney(product.price)} / {product.unit} · Stock: {product.stock}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => openEdit(product)} className="flex h-9 w-9 items-center justify-center rounded-lg text-earth-500 hover:bg-earth-100 transition-colors" aria-label="Editar producto">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product)} className="flex h-9 w-9 items-center justify-center rounded-lg text-earth-400 hover:bg-clay-50 hover:text-clay-600 transition-colors" aria-label="Eliminar producto">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'orders' && (
        orders.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title="Sin pedidos todavía"
            description="Cuando un comprador haga un pedido de tus productos, aparecerá aquí."
          />
        ) : (
          <OrderList orders={orders} perspective="seller" onChanged={loadAll} />
        )
      )}

      {showForm && (
        <ProductFormModal
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}
