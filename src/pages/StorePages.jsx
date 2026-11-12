import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { categories, featuredProducts, formatPrice, products } from "../catalog.js";
import { db } from "../firebase.js";

function matchesProduct(product, term) {
  const categoryName = categories.find(category => category.id === product.category)?.name || "";
  return `${product.name} ${product.description} ${categoryName}`.toLowerCase().includes(term);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "").trim();
}

function isValidKenyanPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^(?:\+?254|0)7\d{8}$/.test(normalized);
}

function ProductCard({ product, onView }) {
  return (
    <article className="store-product-card">
      <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
      <div className="store-product-info">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong>{formatPrice(product.price)}</strong>
        <button type="button" className="button button-primary" onClick={event => onView(product, event.currentTarget)} aria-label={`View ${product.name} details`}>View product</button>
      </div>
    </article>
  );
}

function ProductDialog({ product, onClose, onAdd, returnFocusRef }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!product) {
      const trigger = returnFocusRef?.current;
      if (trigger?.isConnected) trigger.focus();
      if (returnFocusRef) returnFocusRef.current = null;
      return undefined;
    }
    function handleKey(event) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [product, onClose, returnFocusRef]);

  if (!product) return null;

  return (
    <div className="product-dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-product-name">
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Close product details" autoFocus>×</button>
        <img src={product.image} alt={product.name} />
        <div>
          <p className="eyebrow">{categories.find(category => category.id === product.category)?.name}</p>
          <h2 id="dialog-product-name">{product.name}</h2>
          <p>{product.description}</p>
          <strong>{formatPrice(product.price)}</strong>
          <button type="button" className="button button-primary" onClick={() => onAdd(product)}>Add to cart</button>
        </div>
      </section>
    </div>
  );
}

export function HomePage({ query, onAdd }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const returnFocusRef = useRef(null);
  const term = query.trim().toLowerCase();
  const matchingCategories = categories.filter(category => `${category.name} ${category.description}`.toLowerCase().includes(term));
  const matchingProducts = (term ? products : featuredProducts).filter(product => matchesProduct(product, term));
  const closeDialog = () => setSelectedProduct(null);
  const openDialog = (product, trigger) => {
    returnFocusRef.current = trigger;
    setSelectedProduct(product);
  };

  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Good finds, right around the corner</p>
            <h1>Make room for<br /><span>better shopping.</span></h1>
            <p className="hero-description">From everyday essentials to the little upgrades you have been wanting, find it all in one place.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#/featured">Explore products <span aria-hidden="true">→</span></a>
              <a className="text-link" href="#/categories">Browse categories</a>
            </div>
            <div className="trust-note"><span className="trust-dot"></span> Easy ordering <span className="trust-divider">·</span> Local marketplace</div>
          </div>
          <div className="hero-art" aria-label="Shop across electronics, home and kitchen">
            <div className="hero-orbit"></div>
            <figure className="hero-image hero-image-main">
              <img src="img/dell.jpeg" alt="Laptop from the electronics collection" />
              <figcaption><span>Tech that works</span><strong>Everyday electronics</strong></figcaption>
            </figure>
            <figure className="hero-image hero-image-small hero-image-kitchen"><img src="img/sufurias_and_lids.jpeg" alt="Cookware from the kitchen collection" /></figure>
            <figure className="hero-image hero-image-small hero-image-home"><img src="img/bed.jpeg" alt="Bedroom furniture from the home collection" /></figure>
            <span className="hero-sticker">FIND<br />YOUR<br />FAVORITE</span>
          </div>
        </section>

        <section className="benefits" aria-label="Shopping benefits">
          <div><span className="benefit-icon">✦</span><p><strong>Thoughtful finds</strong><small>Everyday products for your life</small></p></div>
          <div><span className="benefit-icon">⌂</span><p><strong>Shop local</strong><small>Discover sellers in your community</small></p></div>
          <div><span className="benefit-icon">♡</span><p><strong>Made simple</strong><small>Browse, choose and order with ease</small></p></div>
        </section>

        <section className="section" id="categories">
          <div className="section-heading">
            <div><p className="eyebrow">A little bit of everything</p><h2>Shop by category</h2></div>
            <p>Find something good for every corner of your day.</p>
          </div>
          <div className="category-grid">
            {matchingCategories.map((category, index) => (
              <a className="category-card" href={`#/category/${category.id}`} key={category.id}>
                <span className="category-number">{String(index + 1).padStart(2, "0")}</span>
                <img src={category.image} alt="" />
                <span className="category-title">{category.name}</span>
                <span className="category-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section className="section featured-section" id="featured">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{term ? "Products across the catalog" : "Worth a closer look"}</p>
              <h2>{term ? "Search results" : "Popular picks"}</h2>
            </div>
            <a className="text-link" href="#/categories">See all categories <span aria-hidden="true">→</span></a>
          </div>
          {term && matchingCategories.length === 0 && matchingProducts.length === 0 && (
            <p className="search-feedback" role="status">No matches for “{query.trim()}”. Try another search or browse the categories.</p>
          )}
          <div className="product-grid">
            {matchingProducts.map(product => (
              <article className="product-card" key={product.id}>
                <a className="product-card-link" href={`#/category/${product.category}`}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                    <span className="product-tag">{categories.find(category => category.id === product.category)?.name}</span>
                  </div>
                  <div className="product-info">
                    <span className="product-category">{product.category.toUpperCase()}</span>
                    <h3>{product.name}</h3>
                    <span className="product-link">Shop now <span aria-hidden="true">→</span></span>
                  </div>
                </a>
                <button type="button" className="product-quick-view" onClick={event => openDialog(product, event.currentTarget)} aria-label={`Quick view ${product.name}`}>Quick view</button>
              </article>
            ))}
          </div>
        </section>

        <section className="closing-banner">
          <div><p className="eyebrow">Your next great find is waiting</p><h2>Good things are closer than you think.</h2></div>
          <a className="button button-light" href="#/categories">Start exploring <span aria-hidden="true">→</span></a>
        </section>
      </main>
      <ProductDialog product={selectedProduct} onClose={closeDialog} onAdd={product => { onAdd(product); closeDialog(); }} returnFocusRef={returnFocusRef} />
    </>
  );
}

export function CategoryPage({ categoryId, query, onAdd }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const returnFocusRef = useRef(null);
  const category = categories.find(item => item.id === categoryId);
  const term = query.trim().toLowerCase();
  const categoryProducts = useMemo(
    () => products.filter(product => product.category === categoryId && matchesProduct(product, term)),
    [categoryId, term]
  );
  const closeDialog = () => setSelectedProduct(null);
  const openDialog = (product, trigger) => {
    returnFocusRef.current = trigger;
    setSelectedProduct(product);
  };

  if (!category) return <main className="page-container"><h1>Category not found</h1><a href="#/categories">Browse categories</a></main>;

  return (
    <main className="page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/categories">Shop all</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{category.name}</span>
      </nav>
      <div className="catalog-heading">
        <img src={category.image} alt="" />
        <div><p className="eyebrow">Explore the collection</p><h1>{category.name}</h1><p>{category.description}</p></div>
      </div>
      <div className="section-heading catalog-section-heading">
        <h2>{term ? "Search results" : "Products"} <span className="muted">({categoryProducts.length})</span></h2>
      </div>
      {categoryProducts.length ? (
        <div className="store-product-grid">
          {categoryProducts.map(product => <ProductCard key={product.id} product={product} onView={openDialog} />)}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{term ? "No matching products" : "New finds are on the way"}</h2>
          <p>{term ? "Try a different search term." : "This collection does not have any listed products yet."}</p>
          <a className="button button-primary" href="#/categories">Browse other categories</a>
        </div>
      )}
      <ProductDialog product={selectedProduct} onClose={closeDialog} onAdd={product => { onAdd(product); closeDialog(); }} returnFocusRef={returnFocusRef} />
    </main>
  );
}

export function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.map(item => {
      const savedQuantity = Number(item.quantity ?? item.qty ?? 1);
      const quantity = Number.isFinite(savedQuantity) && savedQuantity > 0 ? savedQuantity : 1;
      return { ...item, id: String(item.id), price: Number(item.price) || 0, quantity, qty: quantity };
    });
  } catch (error) {
    console.error("Could not read the saved cart.", error);
    return [];
  }
}

export function CartPage({ cart, onChangeQuantity, onRemove, onClear }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="page-container">
      <h1>Your shopping cart</h1>
      {cart.length ? (
        <div className="cart-layout">
          <div className="cart-lines">
            {cart.map(item => (
              <article className="cart-line" key={item.id}>
                <img src={item.image} alt={item.name} loading="lazy" decoding="async" />
                <div className="cart-line-info">
                  <h2>{item.name}</h2>
                  <p>{formatPrice(item.price)}</p>
                  <div className="quantity-control">
                    <button type="button" aria-label={`Decrease ${item.name} quantity`} onClick={() => onChangeQuantity(item.id, -1)} disabled={item.quantity <= 1}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => onChangeQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
                <div className="cart-line-end">
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                  <button type="button" className="remove-button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from cart`}>Remove</button>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <p><span>Subtotal</span><strong>{formatPrice(total)}</strong></p>
            <p><span>Delivery</span><span>Calculated at delivery</span></p>
            <hr />
            <p className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></p>
            <a className="button button-primary" href="#/checkout">Proceed to checkout</a>
            <button type="button" className="text-button" onClick={onClear}>Clear cart</button>
            <a className="continue-shopping" href="#/categories">Continue shopping</a>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Browse the collections and add something you love.</p>
          <a className="button button-primary" href="#/categories">Shop now</a>
        </div>
      )}
    </main>
  );
}

export function CheckoutPage({ cart, user }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [error, setError] = useState("");

  function placeOrder(event) {
    event.preventDefault();
    if (!cart.length) {
      setError("Your cart is empty. Add an item before checking out.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = normalizePhone(form.get("phone"));
    const address = String(form.get("address") || "").trim();
    if (!name || !phone) {
      setError("Please enter your full name and phone number.");
      return;
    }
    if (!isValidKenyanPhone(phone)) {
      setError("Enter a valid Kenya mobile number, for example 2547XXXXXXXX or 07XXXXXXXX.");
      return;
    }

    const pendingOrder = {
      checkoutId: `ORDER_${Date.now()}`,
      customer: { name, phone, address },
      items: cart,
      total,
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString(),
      ...(user ? { userId: user.uid } : {}),
    };
    localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
    window.location.hash = "#/mpesa";
  }

  function orderViaWhatsApp() {
    if (!cart.length) {
      setError("Your cart is empty. Add an item before placing an order.");
      return;
    }
    const message = [
      "New order",
      ...cart.map(item => `${item.name} (${item.quantity}) - KES ${item.price * item.quantity}`),
      `Total: KES ${total}`,
    ].join("\n");
    window.open(`https://wa.me/254117345789?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="page-container checkout-container">
      <h1>Checkout</h1>
      <div className="checkout-columns">
        <section className="checkout-card">
          <h2>Order details</h2>
          {cart.length ? cart.map(item => (
            <div className="checkout-item" key={item.id}>
              <img src={item.image} alt="" loading="lazy" decoding="async" />
              <div><strong>{item.name}</strong><small>{item.quantity} × {formatPrice(item.price)}</small></div>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </div>
          )) : <p className="muted">Your cart is empty. <a href="#/categories">Shop now</a></p>}
          <p className="checkout-total"><span>Total</span><strong>{formatPrice(total)}</strong></p>
        </section>
        <form className="checkout-card customer-form" onSubmit={placeOrder}>
          <h2>Customer details</h2>
          <label>Full name<input name="name" autoComplete="name" required /></label>
          <label>Phone<input name="phone" type="tel" placeholder="2547XXXXXXXX" autoComplete="tel" required pattern="(?:\\+?254|0)7\\d{8}" title="Use a valid Kenya mobile number, for example 2547XXXXXXXX or 07XXXXXXXX" /></label>
          <label>Delivery address <span className="muted">(optional)</span><textarea name="address" rows="3" autoComplete="street-address" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button button-primary" disabled={!cart.length}>Place order &amp; pay (M-Pesa)</button>
          <button type="button" className="button button-whatsapp" onClick={orderViaWhatsApp}>Order via WhatsApp</button>
        </form>
      </div>
    </main>
  );
}

export function PaymentPage({ search }) {
  const [order, setOrder] = useState(null);
  const [isLocalOrder, setIsLocalOrder] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const checkoutId = search.get("checkoutId");
  const docId = search.get("docId");

  useEffect(() => {
    let active = true;
    async function loadOrder() {
      let pending;
      try {
        pending = JSON.parse(localStorage.getItem("pendingOrder") || "null");
      } catch (parseError) {
        console.error("Could not read the pending order.", parseError);
        if (active) setError("The saved order could not be read. Please return to checkout and try again.");
        return;
      }

      const requestedId = checkoutId || pending?.checkoutId;
      if (requestedId && docId) {
        try {
          const snapshot = await getDoc(doc(db, "checkout", docId));
          if (snapshot.exists()) {
            if (active) {
              setOrder({ id: snapshot.id, ...snapshot.data(), checkoutId: requestedId });
              setIsLocalOrder(false);
            }
            return;
          }
        } catch (loadError) {
          console.error("Could not load the saved checkout record.", loadError);
        }
      }

      if (pending && (!requestedId || pending.checkoutId === requestedId)) {
        if (active) setOrder(pending);
        return;
      }
      if (active) setError("No matching order was found. Return to checkout to place your order.");
    }

    loadOrder();
    return () => { active = false; };
  }, [checkoutId, docId]);

  function draw(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
    const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
    if (event.type === "pointerdown") {
      isDrawing.current = true;
      canvas.setPointerCapture(event.pointerId);
      context.beginPath();
      context.moveTo(x, y);
      return;
    }
    if (event.type === "pointerup" || event.type === "pointercancel") {
      isDrawing.current = false;
      return;
    }
    if (isDrawing.current) {
      context.lineTo(x, y);
      context.stroke();
    }
  }

  async function simulatePayment(succeeded) {
    if (!succeeded) {
      setPaymentStatus("Payment failed. You can try again.");
      setReceiptNo("");
      return;
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError("Enter an M-Pesa phone number to continue.");
      return;
    }
    if (!isValidKenyanPhone(normalizedPhone)) {
      setError("Use a valid Kenya mobile number, for example 2547XXXXXXXX or 07XXXXXXXX.");
      return;
    }
    setError("");

    if (!isLocalOrder && docId && order?.id) {
      try {
        await updateDoc(doc(db, "checkout", docId), {
          status: "Paid",
          paidAt: serverTimestamp(),
          paidPhone: phone.trim(),
        });
      } catch (updateError) {
        console.error("Could not update the checkout payment status.", updateError);
        setError("The payment simulation could not update this order. Please try again.");
        return;
      }
    }

    const receipt = `MP${Math.floor(Math.random() * 1e9)}`;
    setReceiptNo(receipt);
    setPaymentStatus("Payment successful");
    try {
      const pending = JSON.parse(localStorage.getItem("pendingOrder") || "null");
      if (pending?.checkoutId === order.checkoutId) {
        localStorage.setItem("pendingOrder", JSON.stringify({ ...pending, status: "Paid", paidPhone: phone.trim() }));
      }
    } catch (storageError) {
      console.error("Could not update the saved order status.", storageError);
    }
  }

  if (error && !order) {
    return <main className="page-container"><div className="empty-state"><p className="form-error">{error}</p><a className="button button-primary" href="#/checkout">Back to checkout</a></div></main>;
  }
  if (!order) return <main className="page-container"><p className="muted">Loading order...</p></main>;

  const customerName = order.customer?.name || order.customerName || "Guest";
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.total) || 0;
  const whatsAppMessage = `MAXIMA STORES\nOrder: ${order.checkoutId}\nTotal: KES ${total}\nStatus: PAID`;

  return (
    <main className="page-container payment-container">
      <section className="checkout-card">
        <p className="eyebrow">Order {order.checkoutId}</p>
        <h1>M-Pesa payment <span className="muted">(simulation)</span></h1>
        <p className="muted">Customer: {customerName} · Status: {paymentStatus || order.status}</p>
        <div className="payment-items">
          {items.map((item, index) => {
            const quantity = Number(item.quantity ?? item.qty ?? 1);
            const price = Number(item.price) || 0;
            return (
              <div className="checkout-item" key={`${item.id || item.name}-${index}`}>
                <img src={item.image || "img/image.png"} alt="" />
                <div><strong>{item.name}</strong><small>{quantity} × {formatPrice(price)}</small></div>
                <strong>{formatPrice(price * quantity)}</strong>
              </div>
            );
          })}
        </div>
        <p className="checkout-total"><span>Total</span><strong>{formatPrice(total)}</strong></p>
        <label className="payment-phone">M-Pesa phone
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={event => setPhone(event.target.value)}
            placeholder="2547XXXXXXXX"
            inputMode="tel"
            aria-invalid={!phone || !isValidKenyanPhone(phone)}
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {paymentStatus && <p className={receiptNo ? "form-success" : "form-error"} role="status">{paymentStatus}</p>}
        <div className="payment-actions">
          <button type="button" className="button button-primary" onClick={() => simulatePayment(true)}>Simulate payment (success)</button>
          <button type="button" className="button button-danger" onClick={() => simulatePayment(false)}>Simulate failure</button>
          <a className="button button-light" href="#/checkout">Back to checkout</a>
        </div>

        {receiptNo && (
          <section className="receipt" id="receipt">
            <img src="img/logo.png" alt="Maximall" />
            <h2>MAXIMA STORES</h2>
            <p className="muted">Quality Furniture · Electronics · Home Essentials</p>
            <hr />
            <p><strong>Receipt No:</strong> {receiptNo}</p>
            <p><strong>Order ID:</strong> {order.checkoutId}</p>
            <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
            <p><strong>M-Pesa Phone:</strong> {phone}</p>
            <p><strong>Status:</strong> PAID</p>
            <hr />
            {items.map((item, index) => {
              const quantity = Number(item.quantity ?? item.qty ?? 1);
              return <p className="receipt-line" key={`${item.name}-${index}`}><span>{item.name} × {quantity}</span><strong>{formatPrice(Number(item.price) * quantity)}</strong></p>;
            })}
            <hr />
            <p className="receipt-line"><strong>Total paid</strong><strong>{formatPrice(total)}</strong></p>
            {signature && <img className="signature-preview" src={signature} alt="Customer signature" />}
            <div className="payment-actions no-print">
              <button type="button" className="button button-primary" onClick={() => window.print()}>Print / PDF</button>
              <button type="button" className="button button-light" onClick={() => setSignatureOpen(true)}>Sign receipt</button>
              <a className="button button-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </section>
        )}
      </section>

      {signatureOpen && (
        <div className="product-dialog-backdrop">
          <section className="signature-dialog" role="dialog" aria-modal="true" aria-labelledby="signature-title">
            <h2 id="signature-title">Sign receipt</h2>
            <canvas
              ref={canvasRef}
              width="560"
              height="240"
              onPointerDown={draw}
              onPointerMove={draw}
              onPointerUp={draw}
              onPointerCancel={draw}
              aria-label="Draw your signature here"
            />
            <div className="payment-actions">
              <button type="button" className="button button-light" onClick={() => canvasRef.current?.getContext("2d").clearRect(0, 0, 560, 240)}>Clear</button>
              <button type="button" className="button button-primary" onClick={() => { setSignature(canvasRef.current.toDataURL()); setSignatureOpen(false); }}>Save</button>
              <button type="button" className="button button-light" onClick={() => setSignatureOpen(false)}>Cancel</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
