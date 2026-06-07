const WISHLIST_KEY = 'carpenter_wishlist';
const sameProductId = (left, right) => String(left) === String(right);

export const wishlistService = {
  get: () => {
    const list = localStorage.getItem(WISHLIST_KEY);
    return list ? JSON.parse(list) : [];
  },
  
  add: (product) => {
    const list = wishlistService.get();
    if (!list.find(p => sameProductId(p.id, product.id))) {
      // Store minimal product info
      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category
      };
      list.push(item);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    }
    return list;
  },
  
  remove: (productId) => {
    const list = wishlistService.get();
    const nextList = list.filter(p => !sameProductId(p.id, productId));
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(nextList));
    return nextList;
  },
  
  isWishlisted: (productId) => {
    const list = wishlistService.get();
    return !!list.find(p => sameProductId(p.id, productId));
  },
  
  toggle: (product) => {
    if (wishlistService.isWishlisted(product.id)) {
      return wishlistService.remove(product.id);
    } else {
      return wishlistService.add(product);
    }
  }
};
