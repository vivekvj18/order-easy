import { ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getProductImage } from '../utils/formatters';
import toast from 'react-hot-toast';

// Get product image path from local assets


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
      <div className="relative overflow-hidden bg-[#F1F5F9] h-[160px] rounded-t-2xl flex items-center justify-center">
        <img
          src={getProductImage(product.id, product.name)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {!inStock && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
            <span className="bg-white text-[#0F172A] text-xs font-semibold px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 text-[#16A34A] px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex-1">
          <h3 className="font-[600] text-[#0F172A] text-[15px] line-clamp-2 leading-tight">{product.name}</h3>
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-[13px] text-[#64748B]">4.{(product.id % 5) + 1} · {50 + (product.id % 200)} reviews</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-[#0F172A] font-[700] text-[16px]">{formatCurrency(product.price)}</p>
          </div>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className="bg-white text-[#16A34A] border border-[#E2E8F0] font-bold text-sm px-4 py-1.5 rounded-lg hover:border-[#16A34A] hover:bg-[#F0FDF4] transition-all disabled:opacity-50"
            >
              ADD
            </button>
          ) : (
            <div
              className="flex items-center gap-1 rounded-lg overflow-hidden bg-[#16A34A] text-white animate-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDecrease}
                className="px-2 py-1.5 font-bold text-sm hover:bg-[#15803D] transition-colors duration-150"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="px-1 text-[13px] font-bold min-w-[1.5rem] text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="px-2 py-1.5 font-bold text-sm hover:bg-[#15803D] transition-colors duration-150"
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
