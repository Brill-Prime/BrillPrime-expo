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

import { 
  validateName, 
  validateDescription, 
  validatePrice, 
  validateNumber 
} from './validation';

export const validateCommodityForm = (data: CommodityFormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Validate name
  const nameValidation = validateName(data.name, 'Product name');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error!;
  }

  // Validate description
  const descriptionValidation = validateDescription(data.description, 10, 200);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error!;
  }

  // Validate price
  const priceValidation = validatePrice(data.price);
  if (!priceValidation.isValid) {
    errors.price = priceValidation.error!;
  } else {
    const priceNum = parseFloat(data.price);
    if (priceNum > 10000000) {
      errors.price = 'Price is too high (maximum ₦10,000,000)';
    }
  }

  // Validate category
  if (!data.category || !CATEGORIES.find(c => c.id === data.category)) {
    errors.category = 'Please select a valid category';
  }

  // Validate unit
  if (!data.unit || !UNITS.includes(data.unit)) {
    errors.unit = 'Please select a valid unit';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
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