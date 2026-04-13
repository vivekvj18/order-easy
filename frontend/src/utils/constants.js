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
