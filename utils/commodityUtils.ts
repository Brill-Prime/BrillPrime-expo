import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Commodity {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  unit: string;
  availableQuantity: number;
  minOrderQuantity: number;
  images: string[];
  specifications?: Record<string, any>;
  tags?: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export interface CommodityFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  unit: string;
  availableQuantity: string;
  minOrderQuantity: string;
  images: string[];
  specifications: Record<string, any>;
  tags: string[];
}

export const COMMODITY_CATEGORIES = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing & Fashion', value: 'clothing' },
  { label: 'Home & Garden', value: 'home_garden' },
  { label: 'Sports & Recreation', value: 'sports' },
  { label: 'Books & Media', value: 'books' },
  { label: 'Automotive', value: 'automotive' },
  { label: 'Health & Beauty', value: 'health_beauty' },
  { label: 'Food & Beverages', value: 'food_beverages' },
  { label: 'Toys & Games', value: 'toys' },
  { label: 'Office Supplies', value: 'office' },
  { label: 'Art & Crafts', value: 'art_crafts' },
  { label: 'Pet Supplies', value: 'pet_supplies' },
  { label: 'Travel & Luggage', value: 'travel' },
  { label: 'Musical Instruments', value: 'music' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Services', value: 'services' },
  { label: 'Other', value: 'other' }
];

export const COMMODITY_UNITS = [
  { label: 'Piece(s)', value: 'piece' },
  { label: 'Kilogram(s)', value: 'kg' },
  { label: 'Gram(s)', value: 'g' },
  { label: 'Liter(s)', value: 'l' },
  { label: 'Milliliter(s)', value: 'ml' },
  { label: 'Meter(s)', value: 'm' },
  { label: 'Centimeter(s)', value: 'cm' },
  { label: 'Pack(s)', value: 'pack' },
  { label: 'Box(es)', value: 'box' },
  { label: 'Dozen(s)', value: 'dozen' },
  { label: 'Set(s)', value: 'set' },
  { label: 'Pair(s)', value: 'pair' },
  { label: 'Bundle(s)', value: 'bundle' },
  { label: 'Bottle(s)', value: 'bottle' },
  { label: 'Can(s)', value: 'can' },
  { label: 'Bag(s)', value: 'bag' },
  { label: 'Roll(s)', value: 'roll' },
  { label: 'Sheet(s)', value: 'sheet' },
  { label: 'Yard(s)', value: 'yard' },
  { label: 'Foot/Feet', value: 'ft' },
  { label: 'Inch(es)', value: 'inch' },
  { label: 'Gallon(s)', value: 'gallon' },
  { label: 'Pound(s)', value: 'lb' },
  { label: 'Ounce(s)', value: 'oz' },
  { label: 'Square Meter(s)', value: 'sqm' },
  { label: 'Square Foot/Feet', value: 'sqft' },
  { label: 'Cubic Meter(s)', value: 'cbm' },
  { label: 'Cubic Foot/Feet', value: 'cbft' },
  { label: 'Ton(s)', value: 'ton' },
  { label: 'Hour(s)', value: 'hour' },
  { label: 'Day(s)', value: 'day' },
  { label: 'Week(s)', value: 'week' },
  { label: 'Month(s)', value: 'month' },
  { label: 'Year(s)', value: 'year' },
  { label: 'Service', value: 'service' }
];

export const validateCommodityForm = (data: CommodityFormData): string[] => {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push('Product name is required');
  }

  if (!data.description.trim()) {
    errors.push('Product description is required');
  }

  if (!data.price || parseFloat(data.price) <= 0) {
    errors.push('Valid price is required');
  }

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.unit) {
    errors.push('Unit is required');
  }

  if (!data.availableQuantity || parseInt(data.availableQuantity) < 0) {
    errors.push('Available quantity must be 0 or greater');
  }

  if (!data.minOrderQuantity || parseInt(data.minOrderQuantity) <= 0) {
    errors.push('Minimum order quantity must be greater than 0');
  }

  if (data.images.length === 0) {
    errors.push('At least one product image is required');
  }

  return errors;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price);
};

export const generateCommodityId = (): string => {
  return 'commodity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const saveCommodityDraft = async (data: Partial<CommodityFormData>): Promise<void> => {
  try {
    await AsyncStorage.setItem('commodity_draft', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving commodity draft:', error);
  }
};

export const loadCommodityDraft = async (): Promise<Partial<CommodityFormData> | null> => {
  try {
    const draft = await AsyncStorage.getItem('commodity_draft');
    return draft ? JSON.parse(draft) : null;
  } catch (error) {
    console.error('Error loading commodity draft:', error);
    return null;
  }
};

export const clearCommodityDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('commodity_draft');
  } catch (error) {
    console.error('Error clearing commodity draft:', error);
  }
};