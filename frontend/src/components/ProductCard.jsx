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
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className="btn-primary text-xs px-3 py-2 rounded-lg"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
