import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import SiteShell from "./components/SiteShell.jsx";
import { categories, formatPrice } from "./catalog.js";
import { CartPage, CategoryPage, CheckoutPage, HomePage, PaymentPage, readCart, WishlistPage } from "./pages/StorePages.jsx";
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const routeSearch = getRouteSearch();
  const routeParams = useMemo(() => new URLSearchParams(routeSearch), [routeSearch]);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const wishlistCount = wishlist.length;
  function submitSearch() {
    if (!["/", "/categories", "/featured"].includes(route)) window.location.hash = "#/";
  }
  const routeTitle = route.startsWith("/category/")
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
    function syncStoreData(event) {
      if (event.key === "cart") setCart(readCart());
      if (event.key === "wishlist") setWishlist(readWishlist());
    }
    window.addEventListener("storage", syncStoreData);
    return () => window.removeEventListener("storage", syncStoreData);
  }, []);

  function addToCart(product) {
    setCart(current => {
      const existing = current.find(item => String(item.id) === String(product.id));
      if (existing) {
        return current.map(item => item === existing
          ? { ...item, quantity: item.quantity + 1, qty: item.quantity + 1 }
          : item);
      }
      return [...current, { ...product, id: String(product.id), price: Number(product.price), quantity: 1, qty: 1 }];
    });
  }

  function changeQuantity(id, amount) {
    setCart(current => current.flatMap(item => {
      if (item.id !== String(id)) return [item];
      const quantity = item.quantity + amount;
      return quantity > 0 ? [{ ...item, quantity, qty: quantity }] : [];
    }));
  }

  function removeFromCart(id) {
    setCart(current => current.filter(item => item.id !== String(id)));
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
    page = <HomePage query={query} searchCategory={searchCategory} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAdd={addToCart} />;
  } else if (route.startsWith("/category/")) {
    page = <CategoryPage categoryId={route.slice("/category/".length)} query={query} wishlist={wishlist} onToggleWishlist={toggleWishlist} onAdd={addToCart} />;
  } else if (route === "/wishlist") {
    page = <WishlistPage wishlist={wishlist} onToggleWishlist={toggleWishlist} onAdd={addToCart} />;
  } else if (route === "/cart") {
    page = <CartPage cart={cart} onChangeQuantity={changeQuantity} onRemove={removeFromCart} onClear={clearCart} />;
  } else if (route === "/checkout") {
    page = <CheckoutPage cart={cart} user={user} />;
  } else if (route === "/mpesa") {
    page = <PaymentPage search={routeParams} />;
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
      {page}
    </SiteShell>
  );
}

export default App;
