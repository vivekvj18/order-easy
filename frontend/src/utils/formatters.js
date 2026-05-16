export const formatCurrency = (amount) => {
  if (amount == null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncate = (str, maxLen = 40) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const extractErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'An unexpected error occurred'
  );
};

// Centralized high-quality image mapping
export const getProductImage = (id, name = '') => {
  const n = name.toLowerCase();
  
  if (n.includes('banana'))  return 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80';
  if (n.includes('milk'))    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80';
  if (n.includes('butter'))  return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80';
  if (n.includes('atta') || n.includes('flour')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80';
  if (n.includes('lays') || n.includes('chip') || n.includes('salted')) return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80';
  if (n.includes('orange') || n.includes('juice')) return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80';
  if (n.includes('egg'))     return 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&q=80';
  if (n.includes('bread') || n.includes('loaf')) return 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80';
  if (n.includes('apple'))   return 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80';
  if (n.includes('paneer') || n.includes('cheese')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80';
  if (n.includes('yogurt') || n.includes('curd')) return 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400&q=80';
  if (n.includes('mango'))   return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80';
  if (n.includes('potato'))  return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/400px-Patates.jpg';
  if (n.includes('onion'))   return 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80';
  if (n.includes('tooth') || n.includes('colgate')) return 'https://images.pexels.com/photos/4465830/pexels-photo-4465830.jpeg?auto=compress&cs=tinysrgb&w=400';
  if (n.includes('handwash') || n.includes('soap')) return 'https://images.pexels.com/photos/4202325/pexels-photo-4202325.jpeg?auto=compress&cs=tinysrgb&w=400';
  
  return `https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80`;
};
