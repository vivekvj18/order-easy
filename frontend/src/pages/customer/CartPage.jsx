import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartItem from '../../components/CartItem';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../utils/formatters';

const CartPage = () => {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const deliveryFee  = totalPrice > 199 ? 0 : 29;
  const platformFee  = 5;
  const grandTotal   = totalPrice + deliveryFee + platformFee;

  if (items.length === 0) {
    return (
      <div className="page-container">
        <h1 className="page-title">Your Cart</h1>
        <EmptyState
          type="products"
          title="Your cart is empty"
          description="Add items from the shop to get started."
          action={
            <button onClick={() => navigate('/home')} className="btn-primary">
              <ShoppingBag className="w-4 h-4" />
              Browse Products
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Your Cart ({totalItems} items)</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-600 hover:underline font-medium transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 card px-6 py-2">
          {items.map((item) => (
            <CartItem key={item.product.id} item={item} />
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="section-title">Order Summary</h2>

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-medium text-gray-800">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery fee</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : 'font-medium text-gray-800'}>
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Platform fee</span>
                <span className="font-medium text-gray-800">{formatCurrency(platformFee)}</span>
              </div>

              {totalPrice <= 199 && (
                <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-xl text-xs text-brand-green">
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                  Add {formatCurrency(199 - totalPrice)} more for free delivery
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total</span>
                <span className="text-brand-green">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/place-order')}
              className="btn-primary w-full py-3.5"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
