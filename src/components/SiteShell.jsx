import React from "react";
import { categories, formatPrice } from "../catalog.js";

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

export default function SiteShell({ children, cartCount, cartSubtotal, onSearch, onSearchCategory, onSearchSubmit, query, route, searchCategory, user }) {
  return (
    <>
      <div className="announcement">
        A better way to shop local <span>•</span> Convenient delivery across Kenya
      </div>
      <header className="site-header">
        <div className="header-main">
          <Brand />
          <div className="delivery-location">
            <span>Deliver to</span>
            <strong><span aria-hidden="true">⌖</span> Kenya</strong>
          </div>
          <form className="search" role="search" onSubmit={event => { event.preventDefault(); onSearchSubmit(); }}>
            <label className="sr-only" htmlFor="search-category">Search department</label>
            <select id="search-category" className="search-category" value={searchCategory} onChange={event => onSearchCategory(event.target.value)}>
              <option value="all">All departments</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="search-input">Search products and categories</label>
            <input
              id="search-input"
              type="search"
              placeholder="What are you looking for?"
              autoComplete="off"
              value={query}
              onChange={event => onSearch(event.target.value)}
            />
            {query && (
              <button type="button" className="search-clear" onClick={() => onSearch("")} aria-label="Clear search">
                Clear
              </button>
            )}
            <button type="submit" aria-label="Search">Search</button>
          </form>
          <div className="header-actions">
            <a className="account-link" href={user ? "#/dashboard" : "#/login"}>
              <span aria-hidden="true">♙</span> {user ? "My account" : "Sign in"}
            </a>
            <a className="cart-link" href="#/cart" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}${cartCount ? `, subtotal ${formatPrice(cartSubtotal)}` : ""}`}>
              <span className="cart-icon" aria-hidden="true">🛒</span>
              <span className="cart-details">
                <span>Cart <span className="cart-count" aria-live="polite" aria-atomic="true">{cartCount}</span></span>
                {cartCount > 0 && <small className="cart-subtotal">Subtotal {formatPrice(cartSubtotal)}</small>}
              </span>
            </a>
          </div>
        </div>
        <nav className="category-nav" aria-label="Main navigation">
          <a href="#/categories" aria-current={route === "/categories" ? "page" : undefined}>☰ Shop all</a>
          <a href="#/featured" aria-current={route === "/featured" ? "page" : undefined}>Popular picks</a>
          <a href="#/category/electronics" aria-current={route === "/category/electronics" ? "page" : undefined}>Electronics</a>
          <a href="#/category/kitchen" aria-current={route === "/category/kitchen" ? "page" : undefined}>Kitchen</a>
          <a href="#/category/bedroom" aria-current={route === "/category/bedroom" ? "page" : undefined}>Home &amp; bedroom</a>
          <a href="#/category/fashion" aria-current={route === "/category/fashion" ? "page" : undefined}>Fashion</a>
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
