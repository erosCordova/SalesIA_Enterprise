import { useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  CheckCircle2,
  CreditCard,
  PackageSearch,
  Plus,
  ReceiptText,
  ShoppingCart,
  Trash2,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import ModuleState from "../../components/ui/ModuleState";

import {
  createSale,
  getCustomers,
  getProducts,
} from "../../services/commercial.service";

import {
  getBranches,
} from "../../services/organization.service";

import { useApiResource } from "../../hooks/useApiResource";

import type {
  Customer,
  PaymentMethod,
  Product,
  SaleCreated,
} from "../../types/commercial";

import "./ventas.css";

interface CartItem {
  product_id: string;
  quantity: number;
  discount: number;
}

function toNumber(value: number | string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(toNumber(value));
}

function customerName(customer: Customer) {
  const business = customer.business_name?.trim();

  if (business) {
    return business;
  }

  const naturalName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return naturalName || customer.document_number || "Cliente";
}

function NuevaVentaPage() {
  const navigate = useNavigate();

  const productsResource = useApiResource(getProducts);

  const customersResource = useApiResource(getCustomers);

  const branchesResource = useApiResource(getBranches);

  const [branchId, setBranchId] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const [selectedDiscount, setSelectedDiscount] = useState(0);

  const [items, setItems] = useState<CartItem[]>([]);

  const [saleDiscount, setSaleDiscount] = useState(0);

  const [taxRate, setTaxRate] = useState(0.18);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [paymentReference, setPaymentReference] = useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [createdSale, setCreatedSale] = useState<SaleCreated | null>(null);

  const products = productsResource.data ?? [];

  const customers = customersResource.data ?? [];

  const branches = branchesResource.data ?? [];

  const activeBranches = useMemo(
    () =>
      branches.filter(
        (branch) =>
          branch.status === "active",
      ),
    [branches],
  );

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.status === "active" && toNumber(product.stock_quantity) > 0,
      ),
    [products],
  );

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.status === "active"),
    [customers],
  );

  const selectedProduct =
    activeProducts.find((product) => product.id === selectedProductId) ?? null;

  function findProduct(productId: string): Product | undefined {
    return products.find((product) => product.id === productId);
  }

  function lineGross(item: CartItem) {
    const product = findProduct(item.product_id);

    if (!product) {
      return 0;
    }

    return roundMoney(toNumber(product.sale_price) * item.quantity);
  }

  function lineSubtotal(item: CartItem) {
    return roundMoney(lineGross(item) - item.discount);
  }

  const subtotal = roundMoney(
    items.reduce((total, item) => total + lineSubtotal(item), 0),
  );

  const taxableAmount = roundMoney(Math.max(0, subtotal - saleDiscount));

  const tax = roundMoney(taxableAmount * taxRate);

  const total = roundMoney(taxableAmount + tax);

  const loading =
    productsResource.loading
    || customersResource.loading
    || branchesResource.loading;

  const loadError =
    productsResource.error
    || customersResource.error
    || branchesResource.error;

  function addProduct() {
    setError("");
    setCreatedSale(null);

    if (!selectedProduct) {
      setError("Selecciona un producto.");

      return;
    }

    if (items.some((item) => item.product_id === selectedProduct.id)) {
      setError("El producto ya fue agregado a la venta.");

      return;
    }

    if (selectedQuantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");

      return;
    }

    const stock = toNumber(selectedProduct.stock_quantity);

    if (selectedQuantity > stock) {
      setError(`Stock insuficiente. Disponible: ${stock}.`);

      return;
    }

    const gross = roundMoney(
      toNumber(selectedProduct.sale_price) * selectedQuantity,
    );

    if (selectedDiscount < 0 || selectedDiscount > gross) {
      setError("El descuento de la línea no puede superar su importe.");

      return;
    }

    setItems((current) => [
      ...current,
      {
        product_id: selectedProduct.id,

        quantity: selectedQuantity,

        discount: roundMoney(selectedDiscount),
      },
    ]);

    setSelectedProductId("");
    setSelectedQuantity(1);
    setSelectedDiscount(0);
  }

  function updateQuantity(productId: string, quantity: number) {
    const product = findProduct(productId);

    const safeQuantity = Math.max(0.01, quantity || 0.01);

    if (product && safeQuantity > toNumber(product.stock_quantity)) {
      setError(`Stock insuficiente para ${product.name}.`);

      return;
    }

    setError("");

    setItems((current) =>
      current.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: safeQuantity,
            }
          : item,
      ),
    );
  }

  function updateDiscount(productId: string, discount: number) {
    const item = items.find((current) => current.product_id === productId);

    if (!item) {
      return;
    }

    const gross = lineGross(item);

    const safeDiscount = Math.max(0, discount || 0);

    if (safeDiscount > gross) {
      setError("El descuento de una línea no puede superar su importe.");

      return;
    }

    setError("");

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.product_id === productId
          ? {
              ...currentItem,
              discount: safeDiscount,
            }
          : currentItem,
      ),
    );
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter((item) => item.product_id !== productId),
    );

    setError("");
  }

  function resetSale() {
    setBranchId("");
    setCustomerId("");
    setSelectedProductId("");
    setSelectedQuantity(1);
    setSelectedDiscount(0);
    setItems([]);
    setSaleDiscount(0);
    setTaxRate(0.18);
    setPaymentMethod("cash");
    setPaymentReference("");
    setNotes("");
    setError("");
  }

  async function submitSale() {
    setError("");
    setCreatedSale(null);

    if (!branchId) {
      setError(
        "Selecciona la sucursal donde se registra la venta.",
      );

      return;
    }

    if (items.length === 0) {
      setError("Agrega al menos un producto a la venta.");

      return;
    }

    for (const item of items) {
      const product = findProduct(item.product_id);

      if (!product) {
        setError("Uno de los productos ya no está disponible.");

        return;
      }

      if (item.quantity <= 0) {
        setError(`La cantidad de ${product.name} debe ser mayor que cero.`);

        return;
      }

      if (item.quantity > toNumber(product.stock_quantity)) {
        setError(`Stock insuficiente para ${product.name}.`);

        return;
      }

      if (item.discount > lineGross(item)) {
        setError(
          `El descuento de ${product.name} supera el importe de la línea.`,
        );

        return;
      }
    }

    if (saleDiscount < 0 || saleDiscount > subtotal) {
      setError("El descuento general no puede superar el subtotal.");

      return;
    }

    if (taxRate < 0 || taxRate > 1) {
      setError("La tasa de impuesto debe estar entre 0 y 1.");

      return;
    }

    setSaving(true);

    try {
      const response = await createSale({
        branch_id: branchId,

        customer_id: customerId || null,

        items: items.map((item) => ({
          product_id: item.product_id,

          quantity: item.quantity,

          discount: roundMoney(item.discount),
        })),

        sale_discount: roundMoney(saleDiscount),

        tax_rate: taxRate,

        payment_method: paymentMethod,

        payment_reference: paymentReference.trim() || null,

        notes: notes.trim() || null,
      });

      setCreatedSale(response);

      resetSale();

      await productsResource.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar la venta.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="module-page">
        <ModuleState
          type="loading"
          title="Preparando nueva venta"
          description="Cargando clientes, productos, precios y stock."
        />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="module-page">
        <ModuleState
          type="error"
          title="No se pudo preparar la venta"
          description={loadError}
        />

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void Promise.all([
                productsResource.reload(),
                customersResource.reload(),
                branchesResource.reload(),
              ]);
            }}
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">REGISTRO DE OPERACIÓN</span>

          <h1>Nueva venta</h1>

          <p>
            Registra una operación comercial real con cliente, productos,
            descuentos, impuestos, pago y actualización automática de
            inventario.
          </p>
        </div>

        <div className="sale-toolbar-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/sales")}
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          <div className="module-main-icon">
            <ShoppingCart size={27} />
          </div>
        </div>
      </div>

      {createdSale && (
        <div className="sale-result">
          <ModuleState
            type="success"
            title="Venta registrada correctamente"
            description={`La operación fue completada por ${formatMoney(
              createdSale.total,
            )}.`}
          />

          <div className="panel">
            <span className="page-eyebrow">NÚMERO DE VENTA</span>

            <div className="sale-result-number">{createdSale.sale_number}</div>

            <div className="sale-stock-info">
              <CheckCircle2 size={15} />
              Venta, pago e inventario actualizados correctamente.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 20,
          }}
        >
          <ModuleState
            type="error"
            title="Revisa la operación"
            description={error}
          />
        </div>
      )}

      <div className="sale-builder-grid">
        <div>
          <article className="panel sale-panel">
            <div className="sale-section-title">
              <Building2 size={20} />

              <div>
                <h2>Sucursal</h2>

                <p>
                  Selecciona dónde se registra esta operación.
                </p>
              </div>
            </div>

            {activeBranches.length === 0 ? (
              <ModuleState
                type="empty"
                title="No hay sucursales activas"
                description="Activa o registra una sucursal antes de crear una venta."
              />
            ) : (
              <label className="sale-field">
                <span>Sucursal</span>

                <select
                  value={branchId}
                  onChange={(event) =>
                    setBranchId(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    Seleccionar sucursal
                  </option>

                  {activeBranches.map(
                    (branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                        {" — "}
                        {branch.code}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
          </article>

          <article
            className="panel sale-panel"
            style={{
              marginTop: 20,
            }}
          >
            <div className="sale-section-title">
              <UserRound size={20} />

              <div>
                <h2>Cliente</h2>

                <p>Selecciona el cliente asociado a la operación.</p>
              </div>
            </div>

            <label className="sale-field">
              <span>Cliente</span>

              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Cliente general / sin cliente</option>

                {activeCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customerName(customer)}
                    {" — "}
                    {customer.document_number || "sin documento"}
                  </option>
                ))}
              </select>
            </label>
          </article>

          <article
            className="panel sale-panel"
            style={{
              marginTop: 20,
            }}
          >
            <div className="sale-section-title">
              <PackageSearch size={20} />

              <div>
                <h2>Productos</h2>

                <p>Agrega productos disponibles respetando el stock actual.</p>
              </div>
            </div>

            {activeProducts.length === 0 ? (
              <ModuleState
                type="empty"
                title="No hay productos disponibles"
                description="No existen productos activos con stock para registrar una venta."
              />
            ) : (
              <div className="sale-product-selector">
                <label>
                  <span>Producto</span>

                  <select
                    value={selectedProductId}
                    onChange={(event) =>
                      setSelectedProductId(event.target.value)
                    }
                  >
                    <option value="">Seleccionar producto</option>

                    {activeProducts.map((product) => {
                      const alreadyAdded = items.some(
                        (item) => item.product_id === product.id,
                      );

                      return (
                        <option
                          key={product.id}
                          value={product.id}
                          disabled={alreadyAdded}
                        >
                          {product.name}
                          {" — "}
                          {formatMoney(product.sale_price)}
                          {" — Stock "}
                          {toNumber(product.stock_quantity)}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  <span>Cantidad</span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={selectedQuantity}
                    onChange={(event) =>
                      setSelectedQuantity(Number(event.target.value))
                    }
                  />
                </label>

                <label>
                  <span>Descuento S/</span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedDiscount}
                    onChange={(event) =>
                      setSelectedDiscount(Number(event.target.value))
                    }
                  />
                </label>

                <button
                  type="button"
                  className="primary-button"
                  onClick={addProduct}
                >
                  <Plus size={16} />
                  Agregar
                </button>
              </div>
            )}

            {selectedProduct && (
              <div
                className="sale-stock-info"
                style={{
                  marginBottom: 16,
                }}
              >
                <Boxes size={15} />
                Stock disponible: {toNumber(selectedProduct.stock_quantity)}
                {" · "}
                Precio: {formatMoney(selectedProduct.sale_price)}
              </div>
            )}

            <div className="sale-cart">
              {items.length === 0 ? (
                <div className="sale-empty-cart">
                  <ShoppingCart size={25} />

                  <strong>Carrito vacío</strong>

                  <p>
                    Selecciona productos para formar el detalle de la venta.
                  </p>
                </div>
              ) : (
                items.map((item) => {
                  const product = findProduct(item.product_id);

                  if (!product) {
                    return null;
                  }

                  return (
                    <div className="sale-cart-item" key={item.product_id}>
                      <div className="sale-cart-product">
                        <strong>{product.name}</strong>

                        <span>
                          {product.sku}
                          {" · "}
                          {formatMoney(product.sale_price)}
                          {" c/u · Stock "}
                          {toNumber(product.stock_quantity)}
                        </span>
                      </div>

                      <label className="sale-cart-control">
                        <span>CANTIDAD</span>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={toNumber(product.stock_quantity)}
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(
                              item.product_id,
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>

                      <label className="sale-cart-control">
                        <span>DESCUENTO</span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(event) =>
                            updateDiscount(
                              item.product_id,
                              Number(event.target.value),
                            )
                          }
                        />
                      </label>

                      <div className="sale-cart-total">
                        <span>SUBTOTAL</span>

                        <strong>{formatMoney(lineSubtotal(item))}</strong>
                      </div>

                      <button
                        type="button"
                        className="sale-remove-button"
                        title="Quitar producto"
                        onClick={() => removeItem(item.product_id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </div>

        <article className="panel sale-summary">
          <div className="sale-section-title">
            <ReceiptText size={20} />

            <div>
              <h2>Resumen de venta</h2>

              <p>Condiciones, pago y total de la operación.</p>
            </div>
          </div>

          <div className="sale-summary-fields">
            <label className="sale-field">
              <span>Descuento general S/</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={saleDiscount}
                onChange={(event) =>
                  setSaleDiscount(Math.max(0, Number(event.target.value) || 0))
                }
              />
            </label>

            <label className="sale-field">
              <span>Impuesto</span>

              <select
                value={taxRate}
                onChange={(event) => setTaxRate(Number(event.target.value))}
              >
                <option value={0.18}>IGV 18%</option>

                <option value={0}>Sin impuesto</option>
              </select>
            </label>

            <label className="sale-field">
              <span>Método de pago</span>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
              >
                <option value="cash">Efectivo</option>

                <option value="card">Tarjeta</option>

                <option value="transfer">Transferencia</option>

                <option value="yape">Yape</option>

                <option value="plin">Plin</option>

                <option value="other">Otro</option>
              </select>
            </label>

            <label className="sale-field">
              <span>Referencia de pago</span>

              <input
                type="text"
                maxLength={150}
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label className="sale-field">
              <span>Notas</span>

              <textarea
                maxLength={1000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones opcionales"
              />
            </label>
          </div>

          <div className="sale-summary-lines">
            <div className="sale-summary-line">
              <span>Productos</span>

              <strong>{items.length}</strong>
            </div>

            <div className="sale-summary-line">
              <span>Subtotal</span>

              <strong>{formatMoney(subtotal)}</strong>
            </div>

            <div className="sale-summary-line">
              <span>Descuento general</span>

              <strong>- {formatMoney(saleDiscount)}</strong>
            </div>

            <div className="sale-summary-line">
              <span>Base imponible</span>

              <strong>{formatMoney(taxableAmount)}</strong>
            </div>

            <div className="sale-summary-line">
              <span>Impuesto</span>

              <strong>{formatMoney(tax)}</strong>
            </div>

            <div className="sale-summary-line total">
              <span>Total</span>

              <strong>{formatMoney(total)}</strong>
            </div>
          </div>

          {saleDiscount > subtotal && items.length > 0 && (
            <div
              className="sale-stock-info"
              style={{
                color: "var(--danger)",
                marginTop: 12,
              }}
            >
              <AlertTriangle size={15} />
              El descuento general supera el subtotal.
            </div>
          )}

          <button
            type="button"
            className="primary-button sale-submit-button"
            disabled={
              saving
              || !branchId
              || items.length === 0
              || saleDiscount > subtotal
            }
            onClick={() => {
              void submitSale();
            }}
          >
            <CreditCard size={17} />

            {saving ? "Registrando..." : "Registrar venta"}
          </button>
        </article>
      </div>
    </section>
  );
}

export default NuevaVentaPage;
