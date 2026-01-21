export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value, decimals = 0) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const formatRiskScore = (score) => {
  return (score * 100).toFixed(0) + '%';
};

export const formatMemberId = (id) => {
  return `M-${id}`;
};

export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export default {
  formatCurrency,
  formatPercentage,
  formatNumber,
  formatDate,
  formatDateTime,
  formatRiskScore,
  formatMemberId,
  truncateText
};