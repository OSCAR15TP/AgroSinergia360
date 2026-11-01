import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Alert } from '@/components/Alert';
import { Check } from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  createProduct,
  marketplaceErrorMessage,
  updateProduct,
  type MarketplaceProduct,
  type ProductCategory,
  type ProductInput,
} from '@/lib/marketplace';

interface ProductFormModalProps {
  product: MarketplaceProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'cacao');
  const [unit, setUnit] = useState(product?.unit ?? 'kg');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceValue = Number(price);
  const stockValue = Number(stock);
  const valid =
    name.trim().length > 0 &&
    unit.trim().length > 0 &&
    Number.isFinite(priceValue) && priceValue > 0 &&
    Number.isInteger(stockValue) && stockValue >= 0;

  const handleSave = async () => {
    if (!valid || saving) return;
    const input: ProductInput = {
      name: name.trim(),
      description: description.trim(),
      category,
      unit: unit.trim(),
      price: Math.round(priceValue * 100) / 100,
      stock: stockValue,
      is_active: isActive,
    };
    setSaving(true);
    setError(null);
    try {
      if (product) {
        await updateProduct(product.id, input);
      } else {
        await createProduct(input);
      }
      onSaved();
      onClose();
    } catch (cause) {
      console.error('product save failed', cause);
      setError(marketplaceErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={product ? 'Editar producto' : 'Nuevo producto'}>
      <div className="space-y-4">
        {error && <Alert type="danger">{error}</Alert>}
        <div>
          <label className="label">Nombre del producto</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cacao seco en grano" className="input" maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)} className="input">
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Unidad de venta</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, saco, caja" className="input" maxLength={20} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Precio por unidad</label>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 4.50" className="input" />
          </div>
          <div>
            <label className="label">Stock disponible</label>
            <input type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Ej: 120" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Descripción (opcional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" maxLength={1000} />
        </div>
        <label className="flex items-center gap-2 text-sm text-earth-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded" />
          Mostrar este producto en la tienda
        </label>
        <button onClick={handleSave} disabled={!valid || saving} className="btn-primary w-full disabled:opacity-50">
          <Check className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </Modal>
  );
}
