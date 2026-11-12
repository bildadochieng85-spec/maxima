import React, { useEffect, useMemo, useState } from "react";

const categories = [
  {
    name: "Electronics",
    image: "img/printer.jpeg",
    href: "electronics.html",
    search: "electronics laptops printers watches headphones gadgets",
  },
  {
    name: "Kitchen & dining",
    image: "img/sufurias_and_lids.jpeg",
    href: "kitchen.html",
    search: "kitchen cookware utensils blender cutlery",
  },
  {
    name: "Home & bedroom",
    image: "img/bed.jpeg",
    href: "Bedroom_layout.html",
    search: "home bedroom beds mattresses furniture",
  },
  {
    name: "Fashion",
    image: "img/wshirt.jpeg",
    href: "Fashion.html",
    search: "fashion clothing clothes style",
  },
];

const products = [
  {
    name: "Dell Windows 11",
    image: "img/dell.jpeg",
    alt: "Dell Windows 11 laptop",
    category: "Electronics",
    eyebrow: "WORK & PLAY",
    href: "electronics.html",
    link: "Explore electronics",
    search: "dell laptop electronics computer windows",
  },
  {
    name: "Sufuria and Lids",
    image: "img/sufurias_and_lids.jpeg",
    alt: "Sufuria and lids cookware set",
    category: "Kitchen",
    eyebrow: "MADE FOR HOME",
    href: "kitchen.html",
    link: "Explore kitchen",
    search: "sufuria lids cookware kitchen pots",
  },
  {
    name: "Luxury Bed",
    image: "img/bed.jpeg",
    alt: "Luxury bed",
    category: "Home",
    eyebrow: "REST EASY",
    href: "Bedroom_layout.html",
    link: "Explore home",
    search: "luxury bed bedroom furniture home",
  },
  {
    name: "Fresh fashion finds",
    image: "img/wshirt.jpeg",
    alt: "Fashion and clothing",
    category: "Fashion",
    eyebrow: "YOUR EVERYDAY STYLE",
    href: "Fashion.html",
    link: "Explore fashion",
    search: "fashion clothing t-shirt style",
  },
];

function getCartCount() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!Array.isArray(savedCart)) return 0;

    return savedCart.reduce((total, item) => {
      const quantity = Number(item.quantity ?? item.qty ?? 1);
      return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
    }, 0);
  } catch (error) {
    console.error("Could not read the saved cart.", error);
    return 0;
  }
}

function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? " brand-footer" : ""}`} href="index.html" aria-label="Maximall home">
      <img src="img/logo.png" alt="" />
      <span>
        maximall
        <small>YOUR EVERYDAY MARKETPLACE</small>
      </span>
    </a>
  );
}

function App() {
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(getCartCount);
  const normalizedQuery = query.trim().toLowerCase();

  const visibleCategories = useMemo(
    () => categories.filter(item => `${item.name} ${item.search}`.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery]
  );
  const visibleProducts = useMemo(
    () => products.filter(item => `${item.name} ${item.search}`.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery]
  );

  useEffect(() => {
    function syncCart(event) {
      if (event.key === "cart") setCartCount(getCartCount());
    }

    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  const noMatches = normalizedQuery && visibleCategories.length === 0 && visibleProducts.length === 0;

  return (
    <>
      <div className="announcement">
        A better way to shop local <span>•</span> Convenient delivery across Kenya
      </div>

      <header className="site-header">
        <div className="header-main">
          <Brand />
          <form className="search" role="search" onSubmit={event => event.preventDefault()}>
            <label className="sr-only" htmlFor="search-input">Search products and categories</label>
            <input
              id="search-input"
              type="search"
              placeholder="What are you looking for?"
              autoComplete="off"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            <button type="submit" aria-label="Search">Search</button>
          </form>
          <div className="header-actions">
            <a className="account-link" href="login.html"><span aria-hidden="true">♙</span> Sign in</a>
            <a className="cart-link" href="cart.html">
              <span aria-hidden="true">🛒</span> Cart <span className="cart-count">{cartCount}</span>
            </a>
          </div>
        </div>
        <nav className="category-nav" aria-label="Main navigation">
          <a href="#categories">Shop all</a>
          <a href="electronics.html">Electronics</a>
          <a href="kitchen.html">Kitchen</a>
          <a href="Bedroom_layout.html">Home &amp; bedroom</a>
          <a href="Fashion.html">Fashion</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Good finds, right around the corner</p>
            <h1>Make room for<br /><span>better shopping.</span></h1>
            <p className="hero-description">From everyday essentials to the little upgrades you have been wanting, find it all in one place.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#featured">Explore products <span aria-hidden="true">→</span></a>
              <a className="text-link" href="#categories">Browse categories</a>
            </div>
            <div className="trust-note"><span className="trust-dot"></span> Easy ordering <span className="trust-divider">·</span> Local marketplace</div>
          </div>
          <div className="hero-art" aria-label="Shop across electronics, home and kitchen">
            <div className="hero-orbit"></div>
            <figure className="hero-image hero-image-main">
              <img src="img/dell.jpeg" alt="Laptop from the electronics collection" />
              <figcaption><span>Tech that works</span><strong>Everyday electronics</strong></figcaption>
            </figure>
            <figure className="hero-image hero-image-small hero-image-kitchen">
              <img src="img/sufurias_and_lids.jpeg" alt="Cookware from the kitchen collection" />
            </figure>
            <figure className="hero-image hero-image-small hero-image-home">
              <img src="img/bed.jpeg" alt="Bedroom furniture from the home collection" />
            </figure>
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
            {visibleCategories.map((category, index) => (
              <a className="category-card" href={category.href} key={category.name}>
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
            <div><p className="eyebrow">Worth a closer look</p><h2>Popular picks</h2></div>
            <a className="text-link" href="#categories">See all categories <span aria-hidden="true">→</span></a>
          </div>
          {noMatches && (
            <p className="search-feedback" role="status">
              No matches for “{query.trim()}”. Try another search or browse the categories.
            </p>
          )}
          <div className="product-grid">
            {visibleProducts.map(product => (
              <a className="product-card" href={product.href} key={product.name}>
                <div className="product-image">
                  <img src={product.image} alt={product.alt} />
                  <span className="product-tag">{product.category}</span>
                </div>
                <div className="product-info">
                  <span className="product-category">{product.eyebrow}</span>
                  <h3>{product.name}</h3>
                  <span className="product-link">{product.link} <span aria-hidden="true">→</span></span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="closing-banner">
          <div><p className="eyebrow">Your next great find is waiting</p><h2>Good things are closer than you think.</h2></div>
          <a className="button button-light" href="#categories">Start exploring <span aria-hidden="true">→</span></a>
        </section>
      </main>

      <footer className="site-footer">
        <Brand footer />
        <p>Shop your community. Find your everyday.</p>
        <div className="footer-links">
          <a href="login.html">Sign in</a>
          <a href="cart.html">Your cart</a>
          <a href="electronics.html">Browse products</a>
        </div>
        <small className="copyright">&copy; 2026 Maximall. All rights reserved.</small>
      </footer>
    </>
  );
}

export default App;
