
export interface CommodityFormData {
  name: string;
  description: string;
  category: string;
  unit: string;
  price: string;
  image: string;
}

export interface Commodity {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  image: string;
  inStock: boolean;
  createdAt: string;
  merchantId: string;
}

export const CATEGORIES = [
  { id: 'petrol', name: 'Petrol', color: '#4682B4' },
  { id: 'lubricant', name: 'Car Lubricant', color: '#4682B4' },
  { id: 'aviation', name: 'Aviation', color: '#4682B4' },
  { id: 'industrial', name: 'Industrial', color: '#4682B4' },
  { id: 'food', name: 'Food & Beverages', color: '#4682B4' },
  { id: 'electronics', name: 'Electronics', color: '#4682B4' },
  { id: 'automotive', name: 'Automotive', color: '#4682B4' },
  { id: 'chemicals', name: 'Chemicals', color: '#4682B4' },
];

export const UNITS = [
  'Litres',
  'Kilograms',
  'Pieces',
  'Boxes',
  'Gallons',
  'Tons',
  'Meters',
  'Grams',
  'Bottles',
  'Packets',
  'Dozen',
  'Cartons',
];

export const validateCommodityForm = (formData: CommodityFormData) => {
  const errors = {
    name: '',
    description: '',
    price: '',
    category: '',
    unit: '',
  };

  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Commodity name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (formData.name.trim().length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  // Description validation
  if (!formData.description.trim()) {
    errors.description = 'Description is required';
  } else if (formData.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (formData.description.trim().length > 200) {
    errors.description = 'Description cannot exceed 200 characters';
  }

  // Price validation
  if (!formData.price.trim()) {
    errors.price = 'Price is required';
  } else {
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'Please enter a valid price greater than 0';
    } else if (price > 1000000) {
      errors.price = 'Price cannot exceed ₦1,000,000';
    }
  }

  // Category validation
  if (!formData.category) {
    errors.category = 'Please select a category';
  }

  // Unit validation
  if (!formData.unit) {
    errors.unit = 'Please select a unit';
  }

  return {
    errors,
    isValid: !Object.values(errors).some(error => error !== ''),
  };
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);
};

export const generateCommodityId = (): string => {
  return `commodity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
