import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { getProducts } from '../../api/inventoryApi';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

const MOCK_PRODUCTS = [
  { id: 1, name: 'Fresh Bananas', category: 'Fruits & Vegetables', price: 49, stockQuantity: 100, description: 'Sweet Cavendish bananas' },
  { id: 2, name: 'Whole Milk 1L', category: 'Dairy & Eggs', price: 68, stockQuantity: 50, description: 'Full cream pasteurized milk' },
  { id: 3, name: 'Amul Butter 100g', category: 'Dairy & Eggs', price: 55, stockQuantity: 80, description: 'Salted table butter' },
  { id: 4, name: 'Aashirvaad Atta 5kg', category: 'Grocery', price: 260, stockQuantity: 30, description: 'Whole wheat flour' },
  { id: 5, name: 'Lays Classic Salted', category: 'Snacks', price: 20, stockQuantity: 200, description: 'Crispy potato chips' },
  { id: 6, name: 'Tropicana Orange 1L', category: 'Beverages', price: 110, stockQuantity: 60, description: '100% pure juice' },
  { id: 7, name: 'Brown Eggs (6 pack)', category: 'Dairy & Eggs', price: 72, stockQuantity: 40, description: 'Free range farm eggs' },
  { id: 8, name: 'Britannia Bread', category: 'Bakery', price: 44, stockQuantity: 90, description: 'Soft whole wheat loaf' },
];

const HomePage = () => {
  const [products, setProducts]         = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCategory, setCategory] = useState('All');
  const [searchQuery, setSearch]        = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.content) ? res.data.content :
                   Array.isArray(res.data?.data) ? res.data.data : [];
      setProducts(data.length > 0 ? data : MOCK_PRODUCTS);
    } catch {
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Filter on category + search
  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [products, selectedCategory, searchQuery]);

  return (
    <div>
      {/* Hero banner */}
      <div className="bg-green-gradient-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-green-300" />
            <span className="text-green-300 text-sm font-medium">Free delivery on orders above ₹199</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Fresh groceries,<br />
            <span className="text-green-300">delivered in 10 mins</span>
          </h1>
          <p className="text-white/70 text-sm max-w-md">
            Over 1,000+ products sourced fresh daily. Shop from local farms and trusted brands.
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products (e.g. milk, eggs, bread…)"
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              id="product-search"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-800 text-sm placeholder-gray-400 shadow-lg focus:ring-2 focus:ring-green-300 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-green hover:text-brand-green'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            type="products"
            title="No products found"
            description={searchQuery ? `No results for "${searchQuery}"` : 'No products in this category yet.'}
            action={
              <button onClick={() => { setSearch(''); setCategory('All'); }} className="btn-secondary">
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
