import React, { useEffect, useMemo, useRef, useState } from "react";
import { categories, featuredProducts, formatPrice, products } from "../catalog.js";
import { getSupabaseClient } from "../supabase.js";

function matchesProduct(product, term) {
  const categoryName = categories.find(category => category.id === product.category)?.name || "";
  return `${product.name} ${product.description} ${categoryName}`.toLowerCase().includes(term);
}

function sortProducts(productList, sortOrder) {
  if (sortOrder === "recommended") return productList;
  return [...productList].sort((a, b) => sortOrder === "price-low" ? a.price - b.price : b.price - a.price);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\s+/g, "").trim();
}

function isValidKenyanPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^(?:\+?254|0)7\d{8}$/.test(normalized);
}

function DeliveryCostNote() {
  return <p className="delivery-cost-note">Delivery costs are calculated separately and are not included in this item subtotal.</p>;
}

function WishlistButton({ product, isSaved, onToggle }) {
  return (
    <button
      type="button"
      className="wishlist-button"
      aria-pressed={isSaved}
      aria-label={`${isSaved ? "Remove" : "Save"} ${product.name} ${isSaved ? "from" : "to"} saved items`}
      onClick={() => onToggle(product.id)}
    >
      {isSaved ? "♥" : "♡"}
    </button>
  );
}

function ProductCard({ product, onView, onAdd, isSaved, onToggleWishlist }) {
  return (
    <article className="store-product-card">
      <WishlistButton product={product} isSaved={isSaved} onToggle={onToggleWishlist} />
      <a className="store-product-image-link" href={`#/product/${product.id}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
      </a>
      <div className="store-product-info">
        <h3><a href={`#/product/${product.id}`}>{product.name}</a></h3>
        <p>{product.description}</p>
        <strong>{formatPrice(product.price)}</strong>
        <div className="store-product-actions">
          <button type="button" className="button button-primary" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>Add to cart</button>
          <button type="button" className="button store-product-view" onClick={event => onView(product, event.currentTarget)} aria-label={`View ${product.name} details`}>Details</button>
        </div>
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

export function HomePage({ query, searchCategory, wishlist, recentlyViewed = [], onToggleWishlist, onAdd, onClearSearch, onClearRecentlyViewed }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOrder, setSortOrder] = useState("recommended");
  const [recentlyViewedCleared, setRecentlyViewedCleared] = useState(false);
  const returnFocusRef = useRef(null);
  const recentlyViewedStatusRef = useRef(null);
  const term = query.trim().toLowerCase();
  const matchingCategories = categories.filter(category =>
    (searchCategory === "all" || category.id === searchCategory) &&
    `${category.name} ${category.description}`.toLowerCase().includes(term)
  );
  const hasSearchFilters = Boolean(term) || searchCategory !== "all";
  const productList = term || searchCategory !== "all" ? products : featuredProducts;
  const matchingProducts = productList.filter(product =>
    (searchCategory === "all" || product.category === searchCategory) && matchesProduct(product, term)
  );
  const sortedProducts = sortProducts(matchingProducts, sortOrder);
  const recentlyViewedProducts = recentlyViewed
    .map(id => products.find(product => String(product.id) === String(id)))
    .filter(Boolean);

  useEffect(() => {
    if (recentlyViewedProducts.length > 0) setRecentlyViewedCleared(false);
  }, [recentlyViewedProducts.length]);

  useEffect(() => {
    if (recentlyViewedCleared) recentlyViewedStatusRef.current?.focus();
  }, [recentlyViewedCleared]);

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
            {matchingCategories.map(category => (
              <a className="category-card" href={`#/category/${category.id}`} key={category.id}>
                <span className="category-title">{category.name}</span>
                <img src={category.image} alt="" loading="lazy" decoding="async" />
                <span className="category-action">Shop this department <span aria-hidden="true">→</span></span>
              </a>
            ))}
          </div>
        </section>

        <section className="section featured-section" id="featured">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{hasSearchFilters ? "Catalog results" : "Worth a closer look"}</p>
              <h2>
                {hasSearchFilters ? "Search results" : "Popular picks"}
                {hasSearchFilters && <span className="muted"> ({matchingProducts.length})</span>}
              </h2>
            </div>
            <div className="section-heading-controls">
              {hasSearchFilters && (
                <label className="catalog-sort">Sort by
                  <select value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
              )}
              <a className="text-link" href="#/categories">See all categories <span aria-hidden="true">→</span></a>
            </div>
          </div>
          {hasSearchFilters && matchingProducts.length === 0 && (
            <p className="search-feedback" role="status">
              No products found{term && ` for “${query.trim()}”`}. Try another search or department.
              {" "}<button type="button" className="text-button" onClick={onClearSearch}>Clear search and filters</button>
            </p>
          )}
          <div className="product-grid">
            {sortedProducts.map(product => (
              <article className="product-card" key={product.id}>
                <WishlistButton product={product} isSaved={wishlist.includes(String(product.id))} onToggle={onToggleWishlist} />
                <a className="product-card-link" href={`#/product/${product.id}`}>
                  <div className="product-image">
                    <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                    <span className="product-tag">{categories.find(category => category.id === product.category)?.name}</span>
                  </div>
                  <div className="product-info">
                    <span className="product-category">{product.category.toUpperCase()}</span>
                    <h3>{product.name}</h3>
                    <strong className="product-price">{formatPrice(product.price)}</strong>
                    <span className="product-link">Shop now <span aria-hidden="true">→</span></span>
                  </div>
                </a>
                <div className="product-card-actions">
                  <button type="button" className="product-add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>Add to cart</button>
                  <button type="button" className="product-quick-view" onClick={event => openDialog(product, event.currentTarget)} aria-label={`Quick view ${product.name}`}>Quick view</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {(recentlyViewedProducts.length > 0 || recentlyViewedCleared) && (
          <section className="section product-related" aria-labelledby="recently-viewed-heading">
            <div className="section-heading">
              <h2 id="recently-viewed-heading">Recently viewed</h2>
              {recentlyViewedProducts.length > 0 && (
                <button type="button" className="text-button" onClick={() => {
                  onClearRecentlyViewed();
                  setRecentlyViewedCleared(true);
                }}>Clear history</button>
              )}
            </div>
            {recentlyViewedProducts.length > 0 ? (
              <div className="store-product-grid">
                {recentlyViewedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onView={openDialog}
                    onAdd={onAdd}
                    isSaved={wishlist.includes(String(product.id))}
                    onToggleWishlist={onToggleWishlist}
                  />
                ))}
              </div>
            ) : (
              <p ref={recentlyViewedStatusRef} role="status" tabIndex={-1}>Recently viewed history cleared.</p>
            )}
          </section>
        )}

        <section className="closing-banner">
          <div><p className="eyebrow">Your next great find is waiting</p><h2>Good things are closer than you think.</h2></div>
          <a className="button button-light" href="#/categories">Start exploring <span aria-hidden="true">→</span></a>
        </section>
      </main>
      <ProductDialog product={selectedProduct} onClose={closeDialog} onAdd={product => { onAdd(product); closeDialog(); }} returnFocusRef={returnFocusRef} />
    </>
  );
}

export function CategoryPage({ categoryId, query, wishlist, onToggleWishlist, onAdd }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOrder, setSortOrder] = useState("recommended");
  const returnFocusRef = useRef(null);
  const category = categories.find(item => item.id === categoryId);
  const term = query.trim().toLowerCase();
  const categoryProducts = useMemo(
    () => products.filter(product => product.category === categoryId && matchesProduct(product, term)),
    [categoryId, term]
  );
  const sortedProducts = useMemo(() => sortProducts(categoryProducts, sortOrder), [categoryProducts, sortOrder]);
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
      <div className="category-catalog-layout">
        <aside className="category-sidebar" aria-label="Shop by department">
          <h2>Departments</h2>
          {categories.map(item => (
            <a href={`#/category/${item.id}`} key={item.id} aria-current={item.id === categoryId ? "page" : undefined}>
              {item.name}
            </a>
          ))}
        </aside>
        <div className="category-results">
          <div className="section-heading catalog-section-heading">
            <h2>{term ? "Search results" : "Products"} <span className="muted">({categoryProducts.length})</span></h2>
            <label className="catalog-sort">Sort by
              <select value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
          {categoryProducts.length ? (
            <div className="store-product-grid">
              {sortedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={openDialog}
                  onAdd={onAdd}
                  isSaved={wishlist.includes(String(product.id))}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>{term ? "No matching products" : "New finds are on the way"}</h2>
              <p>{term ? "Try a different search term." : "This collection does not have any listed products yet."}</p>
              <a className="button button-primary" href="#/categories">Browse other categories</a>
            </div>
          )}
        </div>
      </div>
      <ProductDialog product={selectedProduct} onClose={closeDialog} onAdd={product => { onAdd(product); closeDialog(); }} returnFocusRef={returnFocusRef} />
    </main>
  );
}

export function ProductPage({ productId, wishlist, onToggleWishlist, onAdd, onBuyNow }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [shareStatus, setShareStatus] = useState("");
  const returnFocusRef = useRef(null);
  const requestedQuantity = Number(quantity);
  const isValidQuantity = Number.isInteger(requestedQuantity) && requestedQuantity > 0;
  const product = products.find(item => String(item.id) === String(productId));
  const openDialog = (item, trigger) => {
    returnFocusRef.current = trigger;
    setSelectedProduct(item);
  };
  const closeDialog = () => setSelectedProduct(null);

  useEffect(() => {
    setShareStatus("");
  }, [productId]);

  if (!product) {
    return (
      <main className="page-container empty-state">
        <h1>Product not found</h1>
        <p>This product may no longer be available.</p>
        <a className="button button-primary" href="#/categories">Browse products</a>
      </main>
    );
  }

  const category = categories.find(item => item.id === product.category);
  const relatedProducts = products
    .filter(item => item.category === product.category && item.id !== product.id)
    .slice(0, 4);
  async function copyProductLink() {
    if (!navigator.clipboard?.writeText) {
      setShareStatus("Copying links is not supported by this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("Product link copied.");
    } catch (error) {
      console.error("Could not copy the product link.", error);
      setShareStatus("Could not copy the link. Copy it from your browser address bar.");
    }
  }

  async function shareProduct() {
    setShareStatus("");
    if (!navigator.share) {
      await copyProductLink();
      return;
    }
    try {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
      setShareStatus("Product shared.");
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("Could not share the product.", error);
      setShareStatus("Could not share the product. Copy its link instead.");
    }
  }

  return (
    <main className="page-container product-detail-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a href="#/categories">Shop all</a>
        <span aria-hidden="true">/</span>
        <a href={`#/category/${product.category}`}>{category?.name || "Products"}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>
      <article className="product-detail-layout">
        <div className="product-detail-image">
          <WishlistButton
            product={product}
            isSaved={wishlist.includes(String(product.id))}
            onToggle={onToggleWishlist}
          />
          <img src={product.image} alt={product.name} />
        </div>
        <section className="product-detail-summary">
          <p className="eyebrow">{category?.name || "Maximall marketplace"}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <strong className="product-detail-price">{formatPrice(product.price)}</strong>
          <div className="product-purchase-controls">
            <label className="product-quantity-field" htmlFor="product-quantity">
              Quantity
              <input
                id="product-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={event => setQuantity(event.target.value)}
              />
            </label>
            <div className="product-purchase-buttons">
              <button type="button" className="button button-primary" disabled={!isValidQuantity} onClick={() => onAdd(product, requestedQuantity)}>
                Add to cart
              </button>
              <button type="button" className="button button-light" disabled={!isValidQuantity} onClick={() => onBuyNow(product, requestedQuantity)}>
                Buy now
              </button>
            </div>
          </div>
          {isValidQuantity && (
            <p className="product-detail-total" aria-live="polite">
              Items total ({requestedQuantity}): <strong>{formatPrice(product.price * requestedQuantity)}</strong>
            </p>
          )}
          <div className="product-share">
            <button type="button" className="text-button" onClick={shareProduct}>Share product</button>
            <button type="button" className="text-button" onClick={copyProductLink}>Copy product link</button>
            {shareStatus && <p role="status">{shareStatus}</p>}
          </div>
          <p className="product-detail-note">Convenient delivery across Kenya</p>
        </section>
      </article>
      {relatedProducts.length > 0 && (
        <section className="product-related" aria-labelledby="related-products-heading">
          <h2 id="related-products-heading">You may also like</h2>
          <div className="store-product-grid">
            {relatedProducts.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                onView={openDialog}
                onAdd={onAdd}
                isSaved={wishlist.includes(String(item.id))}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}
      <ProductDialog
        product={selectedProduct}
        onClose={closeDialog}
        onAdd={item => { onAdd(item); closeDialog(); }}
        returnFocusRef={returnFocusRef}
      />
    </main>
  );
}

export function WishlistPage({ wishlist, onToggleWishlist, onAdd, onAddAll, recentlyViewed = [] }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOrder, setSortOrder] = useState("recommended");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const returnFocusRef = useRef(null);
  const savedProducts = products.filter(product => wishlist.includes(String(product.id)));
  const recentlyViewedProducts = recentlyViewed
    .map(id => products.find(product => String(product.id) === String(id)))
    .filter(Boolean);
  const recommendations = (recentlyViewedProducts.length ? recentlyViewedProducts : featuredProducts).slice(0, 4);
  const filteredSavedProducts = savedProducts.filter(product => categoryFilter === "all" || product.category === categoryFilter);
  const sortedSavedProducts = sortProducts(filteredSavedProducts, sortOrder);
  const openDialog = (product, trigger) => {
    returnFocusRef.current = trigger;
    setSelectedProduct(product);
  };
  const closeDialog = () => setSelectedProduct(null);

  return (
    <main className="page-container">
      <div className="wishlist-heading">
        <h1>Saved items <span className="muted">({categoryFilter === "all" ? savedProducts.length : `${filteredSavedProducts.length} of ${savedProducts.length}`})</span></h1>
        {savedProducts.length > 0 && (
          <div className="wishlist-actions">
            <button type="button" className="button button-primary" onClick={() => onAddAll(savedProducts)}>Add all to cart</button>
            {savedProducts.length > 1 && (
              <label className="catalog-sort">Department
                <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
                  <option value="all">All departments</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
            )}
            {filteredSavedProducts.length > 1 && (
              <label className="catalog-sort">Sort by
                <select value={sortOrder} onChange={event => setSortOrder(event.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            )}
          </div>
        )}
      </div>
      {savedProducts.length ? (filteredSavedProducts.length ? (
        <div className="store-product-grid">
          {sortedSavedProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onView={openDialog}
              onAdd={onAdd}
              isSaved
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No saved items in this department</h2>
          <button type="button" className="button button-primary" onClick={() => setCategoryFilter("all")}>Show all saved items</button>
        </div>
      )
      ) : (
        <div className="empty-state">
          <h2>No saved items yet</h2>
          <p>Save products you like and they’ll be waiting here.</p>
          <a className="button button-primary" href="#/categories">Browse products</a>
        </div>
      )}
      {!savedProducts.length && (
        <section className="product-related" aria-labelledby="wishlist-recommendations-heading">
          <h2 id="wishlist-recommendations-heading">{recentlyViewedProducts.length ? "Pick up where you left off" : "Popular picks to get started"}</h2>
          <div className="store-product-grid">
            {recommendations.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onView={openDialog}
                onAdd={onAdd}
                isSaved={false}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
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

function CartQuantityInput({ item, onSetQuantity }) {
  const [draft, setDraft] = useState(String(item.quantity));
  const [error, setError] = useState("");
  const errorId = `cart-quantity-error-${item.id}`;

  useEffect(() => {
    setDraft(String(item.quantity));
    setError("");
  }, [item.quantity]);

  function commitQuantity() {
    const quantity = Number(draft);
    if (Number.isSafeInteger(quantity) && quantity > 0) {
      setError("");
      if (quantity !== item.quantity) onSetQuantity(item.id, quantity);
    } else {
      setError("Enter a whole quantity of 1 or more.");
    }
  }

  return (
    <div className="cart-quantity-field">
      <input
        type="number"
        min="1"
        step="1"
        value={draft}
        aria-label={`Quantity for ${item.name}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={event => {
          setDraft(event.target.value);
          setError("");
        }}
        onBlur={commitQuantity}
        onKeyDown={event => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
      />
      {error && <small id={errorId} className="cart-quantity-error" role="alert">{error}</small>}
    </div>
  );
}

export function CartPage({ cart, onChangeQuantity, onSetQuantity, onRemove, onSaveForLater, onClear, onAdd, recentlyViewed = [], wishlist, onToggleWishlist }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const returnFocusRef = useRef(null);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const recentlyViewedProducts = recentlyViewed
    .map(id => products.find(product => String(product.id) === String(id)))
    .filter(Boolean);
  const recommendations = (recentlyViewedProducts.length ? recentlyViewedProducts : featuredProducts).slice(0, 4);
  const openDialog = (product, trigger) => {
    returnFocusRef.current = trigger;
    setSelectedProduct(product);
  };
  const closeDialog = () => setSelectedProduct(null);

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
                    <CartQuantityInput item={item} onSetQuantity={onSetQuantity} />
                    <button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => onChangeQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
                <div className="cart-line-end">
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                  {products.some(product => String(product.id) === item.id) && (
                    <button type="button" className="save-for-later" onClick={() => onSaveForLater(item.id)}>
                      Save for later
                    </button>
                  )}
                  <button type="button" className="remove-button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.name} from cart`}>Remove</button>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <h2>Order summary</h2>
            <p><span>Delivery</span><span>Calculated separately</span></p>
            <hr />
            <p className="summary-total"><span>Items subtotal</span><strong>{formatPrice(total)}</strong></p>
            <DeliveryCostNote />
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
      {!cart.length && (
        <section className="product-related" aria-labelledby="cart-recommendations-heading">
          <h2 id="cart-recommendations-heading">{recentlyViewedProducts.length ? "Pick up where you left off" : "Popular picks to get started"}</h2>
          <div className="store-product-grid">
            {recommendations.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onView={openDialog}
                onAdd={onAdd}
                isSaved={wishlist.includes(String(product.id))}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}
      <ProductDialog product={selectedProduct} onClose={closeDialog} onAdd={product => { onAdd(product); closeDialog(); }} returnFocusRef={returnFocusRef} />
    </main>
  );
}

export function CheckoutPage({ cart, user }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [customerName, setCustomerName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [contactNotice, setContactNotice] = useState("");
  const phoneEdited = useRef(false);

  useEffect(() => {
    setCustomerName(user?.displayName || "");
    setPhone("");
    setContactNotice("");
    phoneEdited.current = false;
    if (!user) return undefined;

    let active = true;
    async function loadSavedPhone() {
      try {
        const { data, error: profileError } = await getSupabaseClient()
          .from("profiles")
          .select("phone")
          .eq("id", user.uid)
          .maybeSingle();
        if (profileError) throw profileError;
        if (active && !phoneEdited.current && data?.phone) setPhone(data.phone);
      } catch (profileError) {
        console.error("Could not load the saved checkout phone number.", profileError);
        if (active) setContactNotice("Saved phone unavailable. You can enter it below.");
      }
    }

    loadSavedPhone();
    return () => { active = false; };
  }, [user]);

  async function placeOrder(event) {
    event.preventDefault();
    if (!cart.length) {
      setError("Your cart is empty. Add an item before checking out.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const name = customerName.trim();
    const normalizedPhone = normalizePhone(phone);
    const address = String(form.get("address") || "").trim();
    if (!name || !normalizedPhone) {
      setError("Please enter your full name and phone number.");
      return;
    }
    if (!isValidKenyanPhone(normalizedPhone)) {
      setError("Enter a valid Kenya mobile number, for example 2547XXXXXXXX or 07XXXXXXXX.");
      return;
    }

    const pendingOrder = {
      checkoutId: `ORDER_${Date.now()}`,
      customer: { name, phone: normalizedPhone, address },
      items: cart,
      total,
      status: "PENDING_PAYMENT",
      createdAt: new Date().toISOString(),
      ...(user ? { userId: user.uid } : {}),
    };
    setError("");

    if (!user) {
      localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));
      window.location.hash = "#/mpesa";
      return;
    }

    setBusy(true);
    try {
      const { data, error: saveError } = await getSupabaseClient()
        .from("orders")
        .insert({
          checkout_id: pendingOrder.checkoutId,
          user_id: user.uid,
          customer: pendingOrder.customer,
          items: pendingOrder.items,
          total: pendingOrder.total,
          status: "Pending",
        })
        .select("id")
        .single();
      if (saveError) throw saveError;
      window.location.hash = `#/mpesa?checkoutId=${encodeURIComponent(pendingOrder.checkoutId)}&docId=${encodeURIComponent(data.id)}`;
    } catch (saveError) {
      console.error("Could not save the checkout order.", saveError);
      setError(saveError.message || "The order could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function orderViaWhatsApp() {
    if (!cart.length) {
      setError("Your cart is empty. Add an item before placing an order.");
      return;
    }
    const message = [
      "New order",
      ...cart.map(item => `${item.name} (${item.quantity}) - KES ${item.price * item.quantity}`),
      `Items subtotal (delivery calculated separately): KES ${total}`,
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
          <p className="checkout-total"><span>Items subtotal</span><strong>{formatPrice(total)}</strong></p>
          <DeliveryCostNote />
        </section>
        <form className="checkout-card customer-form" onSubmit={placeOrder}>
          <h2>Customer details</h2>
          <label>Full name<input name="name" autoComplete="name" required value={customerName} onChange={event => setCustomerName(event.target.value)} /></label>
          <label>Phone<input name="phone" type="tel" placeholder="2547XXXXXXXX" autoComplete="tel" required pattern="(?:\+?254|0)7\d{8}" title="Use a valid Kenya mobile number, for example 2547XXXXXXXX or 07XXXXXXXX" value={phone} onChange={event => { phoneEdited.current = true; setPhone(event.target.value); }} /></label>
          {contactNotice && <p className="muted" role="status">{contactNotice}</p>}
          <label>Delivery address <span className="muted">(optional)</span><textarea name="address" rows="3" autoComplete="street-address" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button button-primary" disabled={!cart.length || busy}>{busy ? "Saving order..." : "Place order &amp; pay (M-Pesa)"}</button>
          <button type="button" className="button button-whatsapp" onClick={orderViaWhatsApp}>Order via WhatsApp</button>
        </form>
      </div>
    </main>
  );
}

export function PaymentPage({ search, onPaymentSuccess }) {
  const [order, setOrder] = useState(null);
  const [isLocalOrder, setIsLocalOrder] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");
  const [receiptCopyStatus, setReceiptCopyStatus] = useState("");
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signature, setSignature] = useState("");
  const canvasRef = useRef(null);
  const signatureDialogRef = useRef(null);
  const signatureTriggerRef = useRef(null);
  const isDrawing = useRef(false);
  const paymentLock = useRef(false);
  const checkoutId = search.get("checkoutId");
  const docId = search.get("docId");

  useEffect(() => {
    if (!signatureOpen) {
      signatureTriggerRef.current?.focus();
      return undefined;
    }

    const dialog = signatureDialogRef.current;
    const focusable = dialog?.querySelectorAll("button:not([disabled]), [tabindex]:not([tabindex='-1'])");
    focusable?.[0]?.focus();

    function handleSignatureKey(event) {
      if (event.key === "Escape") {
        setSignatureOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusable[0].focus();
      }
    }

    window.addEventListener("keydown", handleSignatureKey);
    return () => window.removeEventListener("keydown", handleSignatureKey);
  }, [signatureOpen]);

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
          const { data, error: loadError } = await getSupabaseClient()
            .from("orders")
            .select("*")
            .eq("id", docId)
            .single();
          if (loadError) throw loadError;
          if (active) {
            setOrder({
              id: data.id,
              checkoutId: data.checkout_id,
              customer: data.customer,
              items: data.items,
              total: Number(data.total),
              status: data.status,
              createdAt: data.created_at,
              paidPhone: data.paid_phone,
            });
            setIsLocalOrder(false);
          }
          return;
        } catch (loadError) {
          console.error("Could not load the saved checkout order.", loadError);
          if (active) setError("The saved order could not be loaded. Please try again or return to checkout.");
          return;
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

  useEffect(() => {
    if (phone) return;
    const checkoutPhone = order?.customer?.phone || order?.customerPhone || order?.phone;
    if (checkoutPhone) setPhone(String(checkoutPhone));
  }, [order, phone]);

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
    if (paymentLock.current || order?.status === "Paid" || paymentStatus === "Payment successful") return;
    if (!succeeded) {
      setPaymentStatus("Payment failed. You can try again.");
      setReceiptNo("");
      setReceiptCopyStatus("");
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
    paymentLock.current = true;
    setIsProcessingPayment(true);
    try {
      if (!isLocalOrder && docId && order?.id) {
        const { error: updateError } = await getSupabaseClient()
          .from("orders")
          .update({
            status: "Paid",
            paid_at: new Date().toISOString(),
            paid_phone: phone.trim(),
          })
          .eq("id", docId)
          .select("id")
          .single();
        if (updateError) throw updateError;
      }

      const receipt = `MP${Math.floor(Math.random() * 1e9)}`;
      setReceiptNo(receipt);
      setReceiptCopyStatus("");
      setPaymentStatus("Payment successful");
      setOrder(current => ({ ...current, status: "Paid" }));
      try {
        const pending = JSON.parse(localStorage.getItem("pendingOrder") || "null");
        if (pending?.checkoutId === order.checkoutId) {
          localStorage.setItem("pendingOrder", JSON.stringify({ ...pending, status: "Paid", paidPhone: phone.trim() }));
        }
      } catch (storageError) {
        console.error("Could not update the saved order status.", storageError);
      }
      onPaymentSuccess();
    } catch (updateError) {
      console.error("Could not update the checkout payment status.", updateError);
      setError("The payment simulation could not update this order. Please try again.");
    } finally {
      paymentLock.current = false;
      setIsProcessingPayment(false);
    }
  }

  async function copyReceiptNumber() {
    if (!navigator.clipboard?.writeText) {
      setReceiptCopyStatus("Copying is not supported by this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(receiptNo);
      setReceiptCopyStatus("Receipt number copied.");
    } catch (copyError) {
      console.error("Could not copy the receipt number.", copyError);
      setReceiptCopyStatus("Could not copy the receipt number. Please copy it from the receipt.");
    }
  }

  if (error && !order) {
    return <main className="page-container"><div className="empty-state"><p className="form-error">{error}</p><a className="button button-primary" href="#/checkout">Back to checkout</a></div></main>;
  }
  if (!order) return <main className="page-container"><p className="muted">Loading order...</p></main>;

  const customerName = order.customer?.name || order.customerName || "Guest";
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.total) || 0;
  const whatsAppMessage = `MAXIMA STORES\nOrder: ${order.checkoutId}\nItems subtotal (delivery calculated separately): KES ${total}\nStatus: PAID`;

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
        <p className="checkout-total"><span>Items subtotal</span><strong>{formatPrice(total)}</strong></p>
        <DeliveryCostNote />
        <label className="payment-phone">M-Pesa phone
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={event => setPhone(event.target.value)}
            placeholder="2547XXXXXXXX"
            inputMode="tel"
            pattern="(?:\+?254|0)7\d{8}"
            title="Use a valid Kenya mobile number, for example 2547XXXXXXXX or 07XXXXXXXX"
            aria-invalid={!phone || !isValidKenyanPhone(phone)}
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {paymentStatus && <p className={receiptNo ? "form-success" : "form-error"} role="status">{paymentStatus}</p>}
        <div className="payment-actions">
          <button type="button" className="button button-primary" onClick={() => simulatePayment(true)} disabled={isProcessingPayment || order.status === "Paid"}>{order.status === "Paid" ? "Payment complete" : isProcessingPayment ? "Processing payment..." : "Simulate payment (success)"}</button>
          <button type="button" className="button button-danger" onClick={() => simulatePayment(false)} disabled={isProcessingPayment || order.status === "Paid"}>Simulate failure</button>
          <a className="button button-light" href="#/checkout">Back to checkout</a>
        </div>

        {receiptNo && (
          <section className="receipt" id="receipt">
            <img src="img/logo.png" alt="Maximall" />
            <h2>MAXIMA STORES</h2>
            <p className="muted">Quality Furniture · Electronics · Home Essentials</p>
            <hr />
            <p className="receipt-line">
              <span><strong>Receipt No:</strong> {receiptNo}</span>
              <button type="button" className="text-button no-print" onClick={copyReceiptNumber}>Copy number</button>
            </p>
            {receiptCopyStatus && <p className="no-print" role="status">{receiptCopyStatus}</p>}
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
            <p className="receipt-line"><strong>Items total paid</strong><strong>{formatPrice(total)}</strong></p>
            <DeliveryCostNote />
            {signature && <img className="signature-preview" src={signature} alt="Customer signature" />}
            <div className="payment-actions no-print">
              <button type="button" className="button button-primary" onClick={() => window.print()}>Print / PDF</button>
              <button ref={signatureTriggerRef} type="button" className="button button-light" onClick={() => setSignatureOpen(true)}>Sign receipt</button>
              <a className="button button-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </section>
        )}
      </section>

      {signatureOpen && (
        <div className="product-dialog-backdrop">
          <section ref={signatureDialogRef} className="signature-dialog" role="dialog" aria-modal="true" aria-labelledby="signature-title">
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
