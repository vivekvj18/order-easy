export const DELIVERY_SLOTS = [
  { value: 'SLOT_10_MIN', label: '10 Minutes — Super Fast' },
  { value: 'SLOT_30_MIN', label: '30 Minutes — Relaxed Delivery' },
  { value: 'SLOT_60_MIN', label: '60 Minutes — Scheduled' },
];

export const ORDER_STATUSES = [
  { value: 'CREATED',          label: 'Created',          color: 'blue'   },
  { value: 'CONFIRMED',        label: 'Confirmed',        color: 'yellow' },
  { value: 'DELIVERED',        label: 'Delivered',        color: 'green'  },
  { value: 'CANCELLED',        label: 'Cancelled',        color: 'red'    },
];

export const AVAILABILITY_STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BUSY',      label: 'Busy'      },
];

export const ROLES = {
  CUSTOMER:         'CUSTOMER',
  ADMIN:            'ADMIN',
  DELIVERY_PARTNER: 'DELIVERY_PARTNER',
};

export const ROLE_HOME_ROUTES = {
  CUSTOMER:         '/home',
  ADMIN:            '/admin/dashboard',
  DELIVERY_PARTNER: '/delivery/deliveries',
};

export const PRODUCT_CATEGORIES = [
  'All',
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Snacks',
  'Beverages',
  'Bakery',
  'Meat & Fish',
  'Personal Care',
  'Household',
];

export const MOCK_PRODUCTS = [
  { id: 1, name: 'Fresh Bananas (6 pcs)', category: 'Fruits & Vegetables', price: 49, description: 'Sweet Cavendish bananas' },
  { id: 2, name: 'Whole Milk 1L', category: 'Dairy & Eggs', price: 68, description: 'Full cream pasteurized milk' },
  { id: 3, name: 'Amul Butter 100g', category: 'Dairy & Eggs', price: 55, description: 'Salted table butter' },
  { id: 4, name: 'Aashirvaad Atta 5kg', category: 'Grocery', price: 260, description: 'Whole wheat flour' },
  { id: 5, name: 'Lays Classic Salted', category: 'Snacks', price: 20, description: 'Crispy potato chips' },
  { id: 6, name: 'Tropicana Orange 1L', category: 'Beverages', price: 110, description: '100% pure juice' },
  { id: 7, name: 'Brown Eggs (6 pack)', category: 'Dairy & Eggs', price: 72, description: 'Free range farm eggs' },
  { id: 8, name: 'Britannia Bread', category: 'Bakery', price: 44, description: 'Soft whole wheat loaf' },
  { id: 9, name: 'Red Apples (4 pcs)', category: 'Fruits & Vegetables', price: 120, description: 'Crispy Royal Gala apples' },
  { id: 10, name: 'Fresh Paneer 200g', category: 'Dairy & Eggs', price: 95, description: 'Soft and fresh malai paneer' },
  { id: 11, name: 'Greek Yogurt Blueberry', category: 'Dairy & Eggs', price: 45, description: 'High protein creamy yogurt' },
  { id: 12, name: 'Alphonso Mangoes (2 pcs)', category: 'Fruits & Vegetables', price: 240, description: 'Premium Ratnagiri Alphonsos' },
  { id: 13, name: 'Potato (1kg)', category: 'Fruits & Vegetables', price: 35, description: 'Fresh organic potatoes' },
  { id: 14, name: 'Onion (1kg)', category: 'Fruits & Vegetables', price: 40, description: 'Pink onions from Nasik' },
  { id: 15, name: 'Colgate Strong Teeth', category: 'Personal Care', price: 92, description: 'Calcium-boosted toothpaste' },
  { id: 16, name: 'Dettol Handwash Refill', category: 'Personal Care', price: 105, description: 'Original germ protection' },
];
