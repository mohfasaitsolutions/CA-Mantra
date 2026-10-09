/**
 * Date utility functions for consistent date formatting across the application
 * All dates are formatted in DD/MM/YYYY format (Indian date format)
 */

/**
 * Format a date to DD/MM/YYYY format
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (date: string | Date | number): string => {
  if (!date) return "-";
  
  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "-";
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date with time to DD/MM/YYYY HH:MM format
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string with time
 */
export const formatDateTime = (date: string | Date | number): string => {
  if (!date) return "-";
  
  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "-";
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format a date to a readable format with month name (e.g., "15 January 2024")
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string with month name
 */
export const formatDateWithMonthName = (date: string | Date | number): string => {
  if (!date) return "-";
  
  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "-";
  
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};

/**
 * Format a date to short month format (e.g., "15 Jan 2024")
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string with short month name
 */
export const formatDateShort = (date: string | Date | number): string => {
  if (!date) return "-";
  
  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "-";
  
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};

/**
 * Format a date to month and year only (e.g., "January 2024")
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted string with month and year
 */
export const formatMonthYear = (date: string | Date | number): string => {
  if (!date) return "-";
  
  const d = new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return "-";
  
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  
  return `${month} ${year}`;
};
