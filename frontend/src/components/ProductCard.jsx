import { ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

// Deterministic image per product id
const getProductImage = (id, name) => {
  const seeds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const seed = seeds[(id || 0) % seeds.length];
  return `https://picsum.photos/seed/${seed}/400/300`;
};

const ProductCard = ({ product }) => {
  const { addItem, items, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Derive quantity directly from cart context — no extra state
  const cartItem = items.find((i) => i.product.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    // updateQuantity removes the item automatically when quantity reaches 0
    updateQuantity(product.id, quantity - 1);
  };

  const inStock = true;

  return (
    <div
      className="card-hover flex flex-col overflow-hidden animate-fade-in"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={getProductImage(product.id, product.name)}
          alt={product.name}
          className="w-full h-44 object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        {!inStock && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2.5 left-2.5 badge bg-white/90 text-gray-700 text-[10px] shadow-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">4.{(product.id % 5) + 1} · {50 + (product.id % 200)} reviews</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-green font-bold text-base">{formatCurrency(product.price)}</p>
          </div>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className="btn-primary text-xs px-3 py-2 rounded-lg"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add
            </button>
          ) : (
            <div
              className="flex items-center gap-1 rounded-lg overflow-hidden border border-brand-green"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDecrease}
                className="px-2 py-1.5 text-brand-green font-bold text-sm hover:bg-brand-green hover:text-white transition-colors duration-150"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="px-2 text-xs font-semibold text-gray-800 min-w-[1.25rem] text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="px-2 py-1.5 text-brand-green font-bold text-sm hover:bg-brand-green hover:text-white transition-colors duration-150"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
