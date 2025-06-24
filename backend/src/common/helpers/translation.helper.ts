export class TranslationHelper {
  private static translations = {
    en: {
      'cart.buyerOnly': 'Only buyers can add products to cart',
      'cart.limitExceeded': 'Cart limit exceeded (10 products max)',
      'cart.alreadyExists': 'Product already in cart',
      'cart.ownProduct': 'You cannot buy your own product',
      'cart.itemNotFound': 'Item not found in cart',
      'products.notFound': 'Product not found',
      'products.notAvailable': 'Product not available for purchase',
      'orders.notFound': 'Order not found',
      'orders.cannotCancel': 'Order cannot be cancelled'
    },
    es: {
      'cart.buyerOnly': 'Solo los compradores pueden agregar productos al carrito',
      'cart.limitExceeded': 'Límite de carrito excedido (máximo 10 productos)',
      'cart.alreadyExists': 'El producto ya está en tu carrito',
      'cart.ownProduct': 'No puedes comprar tu propio producto',
      'cart.itemNotFound': 'Producto no encontrado en el carrito',
      'products.notFound': 'Producto no encontrado',
      'products.notAvailable': 'Producto no disponible para compra',
      'orders.notFound': 'Orden no encontrada',
      'orders.cannotCancel': 'La orden no se puede cancelar'
    }
  };

  static t(key: string, lang: string = 'en', args?: Record<string, any>): string {
    let text = this.translations[lang]?.[key] || this.translations['en'][key] || key;
    
    // Reemplazar variables {variable}
    if (args) {
      Object.keys(args).forEach(argKey => {
        text = text.replace(`{${argKey}}`, args[argKey]);
      });
    }
    
    return text;
  }
}