/*
# Marketplace: products and orders

Adds a shared store where signed-in farmers and partners list products for sale and other signed-in users buy them. Payment is manual (cash or transfer arranged between buyer and seller); the platform records a commission on every order.

1. New Tables
- `marketplace_products`: items a seller offers. Columns: id, seller_id (defaults to the signed-in user), name, description, category, unit, price, stock, is_active, created_at.
- `marketplace_orders`: purchases. Columns: id, buyer_id (defaults to the signed-in user), seller_id, product_id (cleared if the product is deleted), product_name (snapshot), quantity, unit, unit_price, total, commission_rate, commission, buyer_name, buyer_phone, delivery_note, status, created_at.

2. Functions
- `place_marketplace_order`: validates quantity, availability and stock, decrements stock atomically, computes total and commission on the server, and creates the order.
- `set_marketplace_order_status`: lets the seller move an order pending -> confirmed -> delivered, or cancel it; a buyer may cancel their own pending order. Cancelling restores stock.

3. Security
- Row level security enabled on both tables.
- Products: any signed-in user can read active products (shared catalog); sellers can read, add, edit and delete only their own products. seller_id cannot be changed after creation.
- Orders: buyers and sellers can read only orders they are part of. No direct insert, update or delete grants: orders are created and changed only through the functions above.
- Both functions are callable by signed-in users only (no anonymous access).

4. Important notes
- Commission rate is 10% and is stored on each order so later rate changes do not alter past records.
- Prices are stored with two decimals in the currency the seller enters.
- Commission is recorded per order in `marketplace_orders.commission`; no payment is collected by the app yet.
*/

CREATE TABLE IF NOT EXISTS marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  category text NOT NULL CHECK (category IN ('cacao', 'cafe', 'arroz', 'frutas', 'hortalizas', 'otros')),
  unit text NOT NULL DEFAULT 'kg' CHECK (char_length(unit) BETWEEN 1 AND 20),
  price numeric(12, 2) NOT NULL CHECK (price > 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_products_seller_idx ON marketplace_products (seller_id);

ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON marketplace_products FROM anon, authenticated;
GRANT SELECT ON marketplace_products TO authenticated;
GRANT INSERT (name, description, category, unit, price, stock, is_active) ON marketplace_products TO authenticated;
GRANT UPDATE (name, description, category, unit, price, stock, is_active) ON marketplace_products TO authenticated;
GRANT DELETE ON marketplace_products TO authenticated;

DROP POLICY IF EXISTS "select_active_or_own_products" ON marketplace_products;
CREATE POLICY "select_active_or_own_products" ON marketplace_products FOR SELECT
  TO authenticated USING (is_active OR seller_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_products" ON marketplace_products;
CREATE POLICY "insert_own_products" ON marketplace_products FOR INSERT
  TO authenticated WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "update_own_products" ON marketplace_products;
CREATE POLICY "update_own_products" ON marketplace_products FOR UPDATE
  TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_products" ON marketplace_products;
CREATE POLICY "delete_own_products" ON marketplace_products FOR DELETE
  TO authenticated USING (seller_id = auth.uid());

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES marketplace_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 1000),
  unit text NOT NULL,
  unit_price numeric(12, 2) NOT NULL CHECK (unit_price > 0),
  total numeric(12, 2) NOT NULL CHECK (total > 0),
  commission_rate numeric(4, 3) NOT NULL CHECK (commission_rate >= 0),
  commission numeric(12, 2) NOT NULL CHECK (commission >= 0),
  buyer_name text NOT NULL CHECK (char_length(buyer_name) BETWEEN 1 AND 120),
  buyer_phone text NOT NULL CHECK (char_length(buyer_phone) BETWEEN 4 AND 30),
  delivery_note text NOT NULL DEFAULT '' CHECK (char_length(delivery_note) <= 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (buyer_id <> seller_id)
);

CREATE INDEX IF NOT EXISTS marketplace_orders_seller_idx ON marketplace_orders (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS marketplace_orders_buyer_idx ON marketplace_orders (buyer_id, created_at DESC);

ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON marketplace_orders FROM anon, authenticated;
GRANT SELECT ON marketplace_orders TO authenticated;

DROP POLICY IF EXISTS "select_own_orders" ON marketplace_orders;
CREATE POLICY "select_own_orders" ON marketplace_orders FOR SELECT
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE OR REPLACE FUNCTION place_marketplace_order(
  p_product_id uuid,
  p_quantity integer,
  p_buyer_name text,
  p_buyer_phone text,
  p_delivery_note text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product marketplace_products%ROWTYPE;
  v_rate CONSTANT numeric(4, 3) := 0.100;
  v_total numeric(12, 2);
  v_commission numeric(12, 2);
  v_order_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT * INTO v_product
  FROM marketplace_products
  WHERE id = p_product_id AND is_active;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  IF v_product.seller_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot buy your own product';
  END IF;

  UPDATE marketplace_products
  SET stock = stock - p_quantity
  WHERE id = v_product.id AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough stock';
  END IF;

  v_total := round(v_product.price * p_quantity, 2);
  v_commission := round(v_total * v_rate, 2);

  INSERT INTO marketplace_orders (
    buyer_id, seller_id, product_id, product_name, quantity, unit,
    unit_price, total, commission_rate, commission,
    buyer_name, buyer_phone, delivery_note
  ) VALUES (
    auth.uid(), v_product.seller_id, v_product.id, v_product.name, p_quantity, v_product.unit,
    v_product.price, v_total, v_rate, v_commission,
    trim(p_buyer_name), trim(p_buyer_phone), coalesce(trim(p_delivery_note), '')
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION place_marketplace_order(uuid, integer, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION place_marketplace_order(uuid, integer, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION set_marketplace_order_status(p_order_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order marketplace_orders%ROWTYPE;
  v_is_seller boolean;
  v_is_buyer boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT * INTO v_order FROM marketplace_orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  v_is_seller := v_order.seller_id = auth.uid();
  v_is_buyer := v_order.buyer_id = auth.uid();

  IF NOT (v_is_seller OR (v_is_buyer AND p_status = 'cancelled' AND v_order.status = 'pending')) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF NOT (
    (v_order.status = 'pending' AND p_status IN ('confirmed', 'cancelled') AND (v_is_seller OR v_is_buyer))
    OR (v_order.status = 'confirmed' AND p_status IN ('delivered', 'cancelled') AND v_is_seller)
  ) THEN
    RAISE EXCEPTION 'Invalid status change';
  END IF;

  IF p_status = 'cancelled' AND v_order.product_id IS NOT NULL THEN
    UPDATE marketplace_products
    SET stock = stock + v_order.quantity
    WHERE id = v_order.product_id;
  END IF;

  UPDATE marketplace_orders SET status = p_status WHERE id = p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_marketplace_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_marketplace_order_status(uuid, text) TO authenticated;
