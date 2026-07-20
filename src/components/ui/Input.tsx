import React from 'react';

export const Input = ({ label, className = '', ...props }: any) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-semibold text-gray-800">{label}</label>}
      <input
        className="w-full px-3.5 py-2.5 min-h-[44px] border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-base sm:text-sm text-gray-900 bg-white"
        {...props}
      />
    </div>
  );
};

export const Select = ({ label, options, className = '', ...props }: any) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-sm font-semibold text-gray-800">{label}</label>}
      <select
        className="w-full px-3.5 py-2.5 min-h-[44px] border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all text-base sm:text-sm text-gray-900 bg-white"
        {...props}
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

