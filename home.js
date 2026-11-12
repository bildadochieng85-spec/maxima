const cartCount = document.getElementById("cart-count");
const searchForm = document.getElementById("store-search");
const searchInput = document.getElementById("search-input");
const searchFeedback = document.getElementById("search-feedback");
const browseCards = Array.from(document.querySelectorAll(".browse-card"));

function updateCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const count = Array.isArray(cart)
      ? cart.reduce((total, item) => total + Number(item.quantity ?? item.qty ?? 1), 0)
      : 0;
    cartCount.textContent = Number.isFinite(count) ? String(count) : "0";
  } catch (error) {
    console.error("Could not read the saved cart.", error);
    cartCount.textContent = "0";
  }
}

function filterProducts(query) {
  const term = query.trim().toLowerCase();
  let visibleCount = 0;

  browseCards.forEach(card => {
    const matches = !term || `${card.textContent} ${card.dataset.search || ""}`.toLowerCase().includes(term);
    card.hidden = !matches;
    if (matches) visibleCount += 1;
  });

  searchFeedback.textContent = term && visibleCount === 0
    ? `No matches for “${query.trim()}”. Try another search or browse the categories.`
    : "";
}

searchForm.addEventListener("submit", event => event.preventDefault());
searchInput.addEventListener("input", () => filterProducts(searchInput.value));
window.addEventListener("storage", event => {
  if (event.key === "cart") updateCartCount();
});

updateCartCount();
