import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Package, ChevronRight } from 'lucide-react';
import { getProductById } from '../../api/inventoryApi';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty]         = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getProductById(id);
        setProduct(res.data?.data || res.data);
      } catch {
        toast.error('Product not found');
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const cartItem = items.find((i) => i.product.id === product?.id);
  const inStock  = true;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/home')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-green mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </button>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="card overflow-hidden">
          <img
            src={`https://picsum.photos/seed/${(product.id || 0) * 10}/800/600`}
            alt={product.name}
            className="w-full h-72 md:h-96 object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5 animate-slide-up">
          {product.category && (
            <span className="badge-green w-fit">{product.category}</span>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
            <span className="text-sm text-gray-500">(128 reviews)</span>
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center gap-4 py-4 border-y border-gray-100">
            <div>
              <p className="text-3xl font-bold text-brand-green">{formatCurrency(product.price)}</p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-green-600">
                In Stock
              </span>
            </div>
          </div>

          {/* Qty + Add to cart */}
          {inStock && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-3 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-green font-bold text-lg transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold text-gray-800">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-green font-bold text-lg transition-colors"
                >
                  +
                </button>
              </div>
              <button onClick={handleAdd} className="btn-primary flex-1 py-3">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
            </div>
          )}

          {cartItem && (
            <button
              onClick={() => navigate('/cart')}
              className="btn-secondary w-full justify-between"
            >
              <span>View Cart ({cartItem.quantity} items)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
