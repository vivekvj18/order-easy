import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin } from 'lucide-react';
import { getProducts } from '../../api/inventoryApi';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { PRODUCT_CATEGORIES, MOCK_PRODUCTS } from '../../utils/constants';
import toast from 'react-hot-toast';

const CATEGORY_EMOJIS = {
  'Fruits & Vegetables': '🥦',
  'Dairy & Eggs': '🥛',
  'Snacks': '🍟',
  'Beverages': '🧃',
  'Bakery': '🍞',
  'Meat & Fish': '🥩',
  'Personal Care': '🧴',
  'Household': '🏠',
  'All': '✨'
};

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
      <div className="bg-[linear-gradient(135deg,#16A34A_0%,#065F46_100%)] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="flex-1 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-6 text-sm font-medium">
              <MapPin className="w-4 h-4 text-white" />
              <span>Delivering to Bangalore</span>
            </div>
            
            <h1 className="text-[42px] font-[900] leading-tight mb-4 text-white">
              Fresh groceries,<br />
              delivered in 10 mins
            </h1>
            <p className="text-white/80 text-[15px] max-w-md font-medium mb-8">
              Over 1,000+ products sourced fresh daily. Shop from local farms and trusted brands.
            </p>

            {/* Search */}
            <div className="relative max-w-lg w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search for milk, eggs, bread..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                id="product-search"
                className="w-full h-[52px] pl-12 pr-4 rounded-full bg-white text-[#0F172A] text-[15px] placeholder-[#94A3B8] shadow-lg focus:ring-2 focus:ring-[#16A34A] focus:outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="w-[200px] h-[200px] bg-white/10 backdrop-blur-md rounded-3xl flex flex-wrap p-6 content-center justify-center gap-4 transform rotate-3 shadow-2xl border border-white/20 animate-fade-in-up">
              <span className="text-4xl animate-bounce" style={{animationDelay: '0ms'}}>🥛</span>
              <span className="text-4xl animate-bounce" style={{animationDelay: '100ms'}}>🍌</span>
              <span className="text-4xl animate-bounce" style={{animationDelay: '200ms'}}>🥦</span>
              <span className="text-4xl animate-bounce" style={{animationDelay: '300ms'}}>🧴</span>
            </div>
          </div>
        </div>
        
        {/* Wave curve at bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[30px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,112.56,189.92,98.63,262.54,81.19,321.39,56.44,321.39,56.44Z" fill="#F8FAFC"></path>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category pills */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-6">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[15px] font-[600] transition-all duration-200 border ${
                selectedCategory === cat
                  ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#16A34A] hover:text-[#16A34A]'
              }`}
            >
              {CATEGORY_EMOJIS[cat] || ''} {cat}
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

        {/* Grid and Sections */}
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
        ) : selectedCategory === 'All' && !searchQuery ? (
          <div className="flex flex-col gap-10">
            {/* Promo Banner 1 */}
            <div className="w-full h-[80px] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-between px-8 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
              <h2 className="text-white text-xl font-bold relative z-10">🚚 Free delivery on orders above ₹199</h2>
              <button className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm relative z-10">Shop Now</button>
            </div>

            {/* Popular Products */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[20px] font-[700] text-[#0F172A]">🔥 Popular Products</h2>
                <button className="text-[#16A34A] font-[600] text-sm hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.slice(0, 10).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Promo Banner 2 */}
            <div className="w-full h-[80px] rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-between px-8 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
              <h2 className="text-white text-xl font-bold relative z-10">⚡ Express delivery in 10 minutes</h2>
            </div>

            {/* Fresh Arrivals */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[20px] font-[700] text-[#0F172A]">🌿 Fresh Arrivals</h2>
                <button className="text-[#16A34A] font-[600] text-sm hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.slice(10).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
            
            {/* Promo Banner 3 */}
            <div className="w-full h-[80px] rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-between px-8 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
              <h2 className="text-white text-xl font-bold relative z-10">🎁 Fresh arrivals every morning</h2>
            </div>
          </div>
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
