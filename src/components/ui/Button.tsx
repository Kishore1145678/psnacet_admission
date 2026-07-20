import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = 'px-4 py-2.5 min-h-[44px] inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer text-sm sm:text-base';
  const variants: any = {
    primary: 'bg-[#bbf7d0] text-gray-900 hover:bg-[#a7f3d0] focus:ring-green-400 font-extrabold shadow-sm',
    secondary: 'bg-cyan-500 text-white hover:bg-cyan-600 focus:ring-cyan-500 shadow-sm',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

