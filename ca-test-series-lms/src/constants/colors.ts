/**
 * Global Color Constants
 * Centralized color definitions for consistent theming across the application
 */

// Badge Colors
export const BADGE_COLORS = {
  FREE: {
    bg: "bg-green-100",
    text: "text-green-800",
    combined: "bg-green-100 text-green-800",
  },
  PAID: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    combined: "bg-blue-100 text-blue-800",
  },
  FEATURED: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    combined: "bg-yellow-100 text-yellow-800",
  },
  DISCOUNT: {
    bg: "bg-red-100",
    text: "text-red-800",
    combined: "bg-red-100 text-red-800",
  },
  ERROR: {
    bg: "bg-red-100",
    text: "text-red-800",
    combined: "bg-red-100 text-red-800",
  },
  SUCCESS: {
    bg: "bg-green-100",
    text: "text-green-800",
    combined: "bg-green-100 text-green-800",
  },
  WARNING: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    combined: "bg-yellow-100 text-yellow-800",
  },
};

// Text Colors
export const TEXT_COLORS = {
  SUCCESS: "text-green-600",
  ERROR: "text-red-600",
  WARNING: "text-yellow-600",
  INFO: "text-blue-600",
  MUTED: "text-gray-600",
  MUTED_LIGHT: "text-gray-500",
  MUTED_LIGHTER: "text-gray-400",
  DARK: "text-gray-900",
};

// Background Colors
export const BG_COLORS = {
  SUCCESS: "bg-green-50",
  ERROR: "bg-red-50",
  WARNING: "bg-yellow-50",
  INFO: "bg-blue-50",
  LIGHT: "bg-gray-50",
  DEFAULT: "bg-gray-100",
};

// Border Colors
export const BORDER_COLORS = {
  PURPLE: "border-purple-600",
  BLUE: "border-blue-500",
  YELLOW: "border-yellow-500",
  PURPLE_PRIMARY: "border-purple-500",
  INDIGO: "border-indigo-500",
  GRAY: "border-gray-500",
  GRAY_LIGHT: "border-gray-400",
};

// Gradient Colors
export const GRADIENT_COLORS = {
  PRIMARY_TO_ACCENT: "bg-gradient-to-r from-primary to-accent",
  PURPLE_TO_BLUE: "bg-gradient-to-r from-primary to-accent",
  GREEN_TO_BLUE: "bg-gradient-to-r from-primary to-accent",
  BLUE_TO_PURPLE: "bg-gradient-to-r from-primary to-accent",
};

// Loading/Spinner Colors
export const SPINNER_COLORS = {
  PRIMARY: "border-purple-600",
  SECONDARY: "border-blue-600",
};

// Status Colors
export const STATUS_COLORS = {
  OPEN: "bg-red-100 text-red-800",
  CLOSED: "bg-green-100 text-green-800",
  EVALUATED: "bg-green-100 text-green-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  DEFAULT: "bg-gray-100 text-gray-800",
};

// Category Colors
export const CATEGORY_COLORS = {
  TECHNICAL: "border-blue-500 text-blue-500",
  BILLING: "border-yellow-500 text-yellow-500",
  PAYMENT: "border-yellow-500 text-yellow-500",
  EVALUATION: "border-purple-500 text-purple-500",
  TEST: "border-purple-500 text-purple-500",
  ACCOUNT: "border-indigo-500 text-indigo-500",
  GENERAL: "border-gray-500 text-gray-500",
  DEFAULT: "border-gray-400 text-gray-500",
};

// Utility function to get type color
export const getTypeColor = (type: string): string => {
  switch (type) {
    case "FREE":
      return BADGE_COLORS.FREE.combined;
    case "PAID":
      return BADGE_COLORS.PAID.combined;
    default:
      return BADGE_COLORS.FREE.combined;
  }
};

// Utility function to get status color
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "open":
      return STATUS_COLORS.OPEN;
    case "closed":
      return STATUS_COLORS.CLOSED;
    default:
      return STATUS_COLORS.DEFAULT;
  }
};

// Utility function to get category color
export const getCategoryColor = (category: string): string => {
  switch (category?.toLowerCase()) {
    case "technical":
      return CATEGORY_COLORS.TECHNICAL;
    case "billing":
      return CATEGORY_COLORS.BILLING;
    case "payment":
      return CATEGORY_COLORS.PAYMENT;
    case "evaluation":
      return CATEGORY_COLORS.EVALUATION;
    case "test":
      return CATEGORY_COLORS.TEST;
    case "account":
      return CATEGORY_COLORS.ACCOUNT;
    case "general":
      return CATEGORY_COLORS.GENERAL;
    default:
      return CATEGORY_COLORS.DEFAULT;
  }
};
