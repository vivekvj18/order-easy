import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
      {/* Image */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
        <img
          src={`https://picsum.photos/seed/${(product.id || 0) * 10}/200/200`}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</p>
        <p className="text-sm text-brand-green font-bold mt-0.5">{formatCurrency(product.price)}</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(product.id, quantity - 1)}
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-gray-800">{quantity}</span>
        <button
          onClick={() => updateQuantity(product.id, quantity + 1)}
          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtotal */}
      <p className="text-sm font-bold text-gray-900 w-20 text-right">
        {formatCurrency(product.price * quantity)}
      </p>

      {/* Remove */}
      <button
        onClick={() => removeItem(product.id)}
        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CartItem;
