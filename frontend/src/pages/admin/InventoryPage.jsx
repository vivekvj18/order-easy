import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, X, Package } from 'lucide-react';
import { getProducts, createProduct, updateProduct } from '../../api/inventoryApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

const emptyForm = { name: '', description: '', price: '', category: '' };

const InventoryPage = () => {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editProduct, setEdit]    = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getProducts();
      const data = Array.isArray(res.data) ? res.data :
                   Array.isArray(res.data?.content) ? res.data.content : [];
      setProducts(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openAdd = () => {
    setEdit(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (product) => {
    setEdit(product);
    setForm({
      name:          product.name || '',
      description:   product.description || '',
      price:         product.price ?? '',
      category:      product.category || '',
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:         parseFloat(form.price),
      };
      if (editProduct) {
        await updateProduct(editProduct.id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product added');
      }
      setModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Inventory</h1>
        <button onClick={openAdd} className="btn-primary" id="add-product-btn">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : products.length === 0 ? (
        <EmptyState
          type="products"
          title="No products yet"
          description="Add your first product to the inventory."
          action={<button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Product</button>}
        />
      ) : (
        <div className="table-wrapper card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="text-gray-400 text-xs">#{product.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-primary-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-400 max-w-[200px] truncate">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {product.category && (
                      <span className="badge-blue">{product.category}</span>
                    )}
                  </td>
                  <td className="font-semibold text-brand-green">{formatCurrency(product.price)}</td>
                  <td>
                    <button
                      onClick={() => openEdit(product)}
                      className="p-2 text-gray-400 hover:text-brand-green hover:bg-primary-50 rounded-lg transition-all"
                      id={`edit-product-${product.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="form-input"
                  placeholder="e.g. Fresh Apples 1kg"
                  id="product-name-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="form-input resize-none"
                  rows={2}
                  placeholder="Short description…"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="form-input"
                    id="product-price-input"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="form-select"
                  id="product-category-select"
                >
                  <option value="">Select category…</option>
                  {PRODUCT_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1" id="save-product-btn">
                {saving ? <LoadingSpinner size="sm" /> : (editProduct ? 'Save Changes' : 'Add Product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
