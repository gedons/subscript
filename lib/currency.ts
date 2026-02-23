export const CURRENCIES = [
    { label: 'US Dollar', code: 'USD', symbol: '$' },
    { label: 'Euro', code: 'EUR', symbol: '€' },
    { label: 'British Pound', code: 'GBP', symbol: '£' },
    { label: 'Nigerian Naira', code: 'NGN', symbol: '₦' },
    { label: 'Indian Rupee', code: 'INR', symbol: '₹' },
];

export const getCurrencySymbol = (code: string = 'USD') => {
    return CURRENCIES.find(c => c.code === code)?.symbol || '$';
};
