const STORAGE_KEY = "myshop-wishlist";

export function readWishlist() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveWishlist(products) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function updateWishlist(product, saved) {
  const products = readWishlist().filter((item) => String(item._id) !== String(product._id));
  if (saved) products.push(product);
  saveWishlist(products);
  return products;
}

export function clearWishlist() {
  window.localStorage.removeItem(STORAGE_KEY);
}
