import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { Alert } from '@/components/Alert';
import { Check } from 'lucide-react';
import { formatMoney, marketplaceErrorMessage, placeOrder, type MarketplaceProduct } from '@/lib/marketplace';

interface PlaceOrderModalProps {
  product: MarketplaceProduct;
  onClose: () => void;
  onPlaced: () => void;
}

export function PlaceOrderModal({ product, onClose, onPlaced }: PlaceOrderModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantityValue = Number(quantity);
  const quantityValid = Number.isInteger(quantityValue) && quantityValue >= 1 && quantityValue <= product.stock;
  const valid = quantityValid && buyerName.trim().length > 0 && buyerPhone.trim().length >= 4;
  const total = quantityValid ? product.price * quantityValue : 0;

  const handleOrder = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await placeOrder({
        productId: product.id,
        quantity: quantityValue,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        deliveryNote: deliveryNote.trim(),
      });
      onPlaced();
      onClose();
    } catch (cause) {
      console.error('order placement failed', cause);
      setError(marketplaceErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Pedir: ${product.name}`}>
      <div className="space-y-4">
        {error && <Alert type="danger">{error}</Alert>}
        <div>
          <label className="label">Cantidad ({product.unit})</label>
          <input type="number" min="1" max={product.stock} step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
          <p className="text-xs text-earth-500 mt-1">Disponible: {product.stock} {product.unit}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tu nombre</label>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="input" maxLength={120} />
          </div>
          <div>
            <label className="label">Teléfono de contacto</label>
            <input type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input" maxLength={30} />
          </div>
        </div>
        <div>
          <label className="label">Lugar o indicaciones de entrega (opcional)</label>
          <textarea value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} rows={2} className="input" maxLength={500} />
        </div>
        <div className="rounded-xl bg-earth-50 p-4 text-sm text-earth-700">
          <div className="flex justify-between"><span>Total a pagar</span><span className="font-bold text-earth-900">{formatMoney(total)}</span></div>
          <p className="text-xs text-earth-500 mt-2">El pago se acuerda directamente con el vendedor (efectivo o transferencia) al confirmar la entrega.</p>
        </div>
        <button onClick={handleOrder} disabled={!valid || saving} className="btn-primary w-full disabled:opacity-50">
          <Check className="h-4 w-4" /> {saving ? 'Enviando pedido...' : 'Confirmar pedido'}
        </button>
      </div>
    </Modal>
  );
}
