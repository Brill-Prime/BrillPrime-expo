/**
 * Currency utility functions for Nigerian Naira (₦)
 */

/**
 * Format a number as Nigerian Naira currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string with ₦ symbol
 */
export const formatNaira = (
  amount: number,
  options?: {
    includeDecimals?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  const {
    includeDecimals = true,
    minimumFractionDigits = includeDecimals ? 2 : 0,
    maximumFractionDigits = includeDecimals ? 2 : 0,
  } = options || {};

  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits,
    maximumFractionDigits,
  })}`;
};

/**
 * Parse a Naira string to number
 * @param nairaString - String like "₦1,000.00"
 * @returns Numeric value
 */
export const parseNaira = (nairaString: string): number => {
  return parseFloat(nairaString.replace(/[₦,]/g, ''));
};

/**
 * Format Naira without decimals
 * @param amount - The amount to format
 * @returns Formatted currency string without decimals
 */
export const formatNairaWhole = (amount: number): string => {
  return formatNaira(amount, { includeDecimals: false });
};

/**
 * Currency symbol for Nigeria
 */
export const NAIRA_SYMBOL = '₦';

/**
 * Currency code for Nigeria
 */
export const CURRENCY_CODE = 'NGN';


/**
 * Format a number with thousands separators
 * @param amount - The amount to format
 * @returns Formatted number string
 */
export function formatNumber(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0';
  }

  return new Intl.NumberFormat('en-NG').format(amount);
}