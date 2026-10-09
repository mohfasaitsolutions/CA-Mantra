
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800';
    case 'closed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'technical':
      return 'border-blue-500 text-blue-500';
    case 'billing':
    case 'payment':
      return 'border-yellow-500 text-yellow-500';
    case 'evaluation':
    case 'test':
      return 'border-purple-500 text-purple-500';
    case 'account':
      return 'border-indigo-500 text-indigo-500';
    case 'general':
      return 'border-gray-500 text-gray-500';
    default:
      return 'border-gray-400 text-gray-500';
  }
};
