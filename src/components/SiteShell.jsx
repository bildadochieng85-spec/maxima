export function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? " brand-footer" : ""}`} href="#/" aria-label="Maximall home">
      <img src="img/logo.png" alt="" />
      <span>
        maximall
        <small>YOUR EVERYDAY MARKETPLACE</small>
      </span>
    </a>
  );
}

export default function SiteShell({ children, cartCount, onSearch, query, user }) {
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
              onChange={event => onSearch(event.target.value)}
            />
            <button type="submit" aria-label="Search">Search</button>
          </form>
          <div className="header-actions">
            <a className="account-link" href={user ? "#/dashboard" : "#/login"}>
              <span aria-hidden="true">♙</span> {user ? "My account" : "Sign in"}
            </a>
            <a className="cart-link" href="#/cart" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
              <span aria-hidden="true">🛒</span> Cart <span className="cart-count" aria-live="polite" aria-atomic="true">{cartCount}</span>
            </a>
          </div>
        </div>
        <nav className="category-nav" aria-label="Main navigation">
          <a href="#/categories">Shop all</a>
          <a href="#/category/electronics">Electronics</a>
          <a href="#/category/kitchen">Kitchen</a>
          <a href="#/category/bedroom">Home &amp; bedroom</a>
          <a href="#/category/fashion">Fashion</a>
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <Brand footer />
        <p>Shop your community. Find your everyday.</p>
        <div className="footer-links">
          <a href="#/login">Sign in</a>
          <a href="#/cart">Your cart</a>
          <a href="#/categories">Browse products</a>
        </div>
        <small className="copyright">&copy; 2026 Maximall. All rights reserved.</small>
      </footer>
    </>
  );
}
