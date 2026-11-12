import React, { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import SiteShell from "./components/SiteShell.jsx";
import { categories, formatPrice, products } from "./catalog.js";
import { CartPage, CategoryPage, CheckoutPage, HomePage, PaymentPage, ProductPage, readCart, WishlistPage } from "./pages/StorePages.jsx";
import { DashboardPage, LoginPage, SignupPage } from "./pages/AccountPages.jsx";

function currentRoute() {
  const hashRoute = window.location.hash.slice(1).split("?")[0];
  if (hashRoute) return hashRoute;

  const legacyRoutes = {
    "/index.html": "/",
    "/electronics.html": "/category/electronics",
    "/kitchen.html": "/category/kitchen",
    "/Fashion.html": "/category/fashion",
    "/Bedroom_layout.html": "/category/bedroom",
    "/cart.html": "/cart",
    "/checkout.html": "/checkout",
    "/mpesa.html": "/mpesa",
    "/login.html": "/login",
    "/signup.html": "/signup",
    "/dashboard.html": "/dashboard",
  };
  return legacyRoutes[window.location.pathname] || "/";
}

function getRouteSearch() {
  const hashParts = window.location.hash.slice(1).split("?");
  return hashParts[1] || window.location.search.slice(1);
}

function addProductToCart(cartItems, product, quantity) {
  const existing = cartItems.find(item => String(item.id) === String(product.id));
  if (existing) {
    return cartItems.map(item => item === existing
      ? { ...item, quantity: item.quantity + quantity, qty: item.quantity + quantity }
      : item);
  }
  return [...cartItems, { ...product, id: String(product.id), price: Number(product.price), quantity, qty: quantity }];
}

function readWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
    return Array.isArray(saved)
      ? [...new Set(saved.filter(id => typeof id === "string" || typeof id === "number").map(String))]
      : [];
  } catch (error) {
    console.error("Could not read saved items.", error);
    return [];
  }
}

function readRecentlyViewed() {
  try {
    const saved = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    const productIds = new Set(products.map(product => String(product.id)));
    return Array.isArray(saved)
      ? [...new Set(saved.filter(id => typeof id === "string" || typeof id === "number").map(String))]
        .filter(id => productIds.has(id))
        .slice(0, 8)
      : [];
  } catch (error) {
    console.error("Could not read recently viewed products.", error);
    return [];
  }
}

function useRoute() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const updateRoute = () => setRoute(currentRoute());
    window.addEventListener("hashchange", updateRoute);
    window.addEventListener("popstate", updateRoute);
    return () => {
      window.removeEventListener("hashchange", updateRoute);
      window.removeEventListener("popstate", updateRoute);
    };
  }, []);
  return route;
}

function App() {
  const route = useRoute();
  const [query, setQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [cart, setCart] = useState(readCart);
  const [wishlist, setWishlist] = useState(readWishlist);
  const [recentlyViewed, setRecentlyViewed] = useState(readRecentlyViewed);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const cartNoticeTimer = useRef(null);
  const routeSearch = getRouteSearch();
  const routeParams = useMemo(() => new URLSearchParams(routeSearch), [routeSearch]);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const wishlistCount = wishlist.length;
  const routeProduct = route.startsWith("/product/")
    ? products.find(product => String(product.id) === route.slice("/product/".length))
    : null;
  function submitSearch() {
    if (!["/", "/categories", "/featured"].includes(route)) window.location.hash = "#/";
  }
  function clearSearch() {
    setQuery("");
    setSearchCategory("all");
  }
  function clearRecentlyViewed() {
    setRecentlyViewed([]);
  }
  const routeTitle = route.startsWith("/product/")
    ? routeProduct?.name || "Product not found"
    : route.startsWith("/category/")
      ? categories.find(category => category.id === route.slice("/category/".length))?.name || "Category not found"
      : ({
      "/": "Your everyday marketplace",
      "/categories": "Shop all",
      "/featured": "Popular picks",
      "/cart": "Your cart",
      "/wishlist": "Saved items",
      "/checkout": "Checkout",
      "/mpesa": "Payment",
      "/login": "Sign in",
      "/signup": "Create account",
      "/dashboard": "My account",
    }[route] || "Page not found");

  useEffect(() => {
    document.title = `${routeTitle} | Maximall`;
  }, [routeTitle]);

  useEffect(() => {
    if (route === "/featured") document.getElementById("featured")?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    if (!route.startsWith("/product/")) return;
    const productId = route.slice("/product/".length);
    if (!products.some(product => String(product.id) === productId)) return;
    setRecentlyViewed(current => [productId, ...current.filter(id => id !== productId)].slice(0, 8));
  }, [route]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setAuthLoading(false);
      setAuthError("");
    }, error => {
      console.error("Could not check the current sign-in state.", error);
      setAuthError(error.message);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Could not save the cart.", error);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch (error) {
      console.error("Could not save saved items.", error);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error("Could not save recently viewed products.", error);
    }
  }, [recentlyViewed]);

  useEffect(() => {
    function syncStoreData(event) {
      if (event.key === "cart") setCart(readCart());
      if (event.key === "wishlist") setWishlist(readWishlist());
      if (event.key === "recentlyViewed") setRecentlyViewed(readRecentlyViewed());
    }
    window.addEventListener("storage", syncStoreData);
    return () => window.removeEventListener("storage", syncStoreData);
  }, []);

  useEffect(() => () => {
    if (cartNoticeTimer.current !== null) window.clearTimeout(cartNoticeTimer.current);
  }, []);

  function addToCart(product, quantity = 1) {
    setCart(current => addProductToCart(current, product, quantity));
    showCartNotice(`${quantity > 1 ? `${quantity} × ` : ""}${product.name} added to your cart.`);
  }

  function addSavedItemsToCart(savedProducts) {
    setCart(current => savedProducts.reduce((items, product) => addProductToCart(items, product, 1), current));
    const itemCount = savedProducts.length;
    showCartNotice(`${itemCount} saved ${itemCount === 1 ? "item" : "items"} added to your cart.`);
  }

  function showCartNotice(message) {
    setCartNotice(message);
    if (cartNoticeTimer.current !== null) window.clearTimeout(cartNoticeTimer.current);
    cartNoticeTimer.current = window.setTimeout(() => {
      setCartNotice("");
      cartNoticeTimer.current = null;
    }, 3000);
  }

  function buyNow(product, quantity = 1) {
    addToCart(product, quantity);
    window.location.hash = "#/checkout";
  }

  function dismissCartNotice() {
    if (cartNoticeTimer.current !== null) {
      window.clearTimeout(cartNoticeTimer.current);
      cartNoticeTimer.current = null;
    }
    setCartNotice("");
  }

  function changeQuantity(id, amount) {
    setCart(current => current.flatMap(item => {
      if (item.id !== String(id)) return [item];
      const quantity = item.quantity + amount;
      return quantity > 0 ? [{ ...item, quantity, qty: quantity }] : [];
    }));
  }

  function setQuantity(id, quantity) {
    setCart(current => current.map(item => item.id === String(id)
      ? { ...item, quantity, qty: quantity }
      : item));
  }

  function removeFromCart(id) {
    setCart(current => current.filter(item => item.id !== String(id)));
  }

  function saveForLater(id) {
    const productId = String(id);
    if (products.some(product => String(product.id) === productId)) {
      setWishlist(current => current.includes(productId) ? current : [...current, productId]);
    }
    removeFromCart(productId);
  }

  function toggleWishlist(id) {
    const productId = String(id);
    setWishlist(current => current.includes(productId)
      ? current.filter(savedId => savedId !== productId)
      : [...current, productId]);
  }

  function clearCart() {
    if (window.confirm("Are you sure you want to clear the cart?")) setCart([]);
  }

  let page;
  if (route === "/" || route === "/categories" || route === "/featured") {
    page = <HomePage query={query} searchCategory={searchCategory} wishlist={wishlist} recentlyViewed={recentlyViewed} onToggleWishlist={toggleWishlist} onAdd={addToCart} onClearSearch={clearSearch} onClearRecentlyViewed={clearRecentlyViewed} />;
  } else if (route.startsWith("/product/")) {
    page = <ProductPage productId={route.slice("/product/".length)} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAdd={addToCart} onBuyNow={buyNow} />;
  } else if (route.startsWith("/category/")) {
    page = <CategoryPage categoryId={route.slice("/category/".length)} query={query} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAdd={addToCart} />;
  } else if (route === "/wishlist") {
    page = <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onAdd={addToCart} onAddAll={addSavedItemsToCart} />;
  } else if (route === "/cart") {
    page = <CartPage cart={cart} onChangeQuantity={changeQuantity} onSetQuantity={setQuantity} onRemove={removeFromCart} onSaveForLater={saveForLater} onClear={clearCart} />;
  } else if (route === "/checkout") {
    page = <CheckoutPage cart={cart} user={user} />;
  } else if (route === "/mpesa") {
    page = <PaymentPage search={routeParams} onPaymentSuccess={() => setCart([])} />;
  } else if (route === "/login") {
    page = <LoginPage />;
  } else if (route === "/signup") {
    page = <SignupPage />;
  } else if (route === "/dashboard") {
    page = <DashboardPage user={user} loading={authLoading} />;
  } else {
    page = <main className="page-container empty-state"><h1>Page not found</h1><a className="button button-primary" href="#/">Return to Maximall</a></main>;
  }

  return (
    <SiteShell
      cartCount={cartCount}
      cartSubtotal={cartSubtotal}
      wishlistCount={wishlistCount}
      onSearch={setQuery}
      onSearchCategory={setSearchCategory}
      onSearchSubmit={submitSearch}
      query={query}
      route={route}
      searchCategory={searchCategory}
      user={user}
    >
      {authError && <p className="global-error" role="alert">Sign-in status could not be checked: {authError}</p>}
      {cartNotice && route !== "/checkout" && (
        <div className="cart-notice" role="status" aria-live="polite" aria-atomic="true">
          <span>{cartNotice}</span>
          <a href="#/cart">View cart</a>
          <button type="button" onClick={dismissCartNotice} aria-label="Dismiss cart confirmation">×</button>
        </div>
      )}
      {page}
    </SiteShell>
  );
}

export default App;
