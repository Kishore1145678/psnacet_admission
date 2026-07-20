import React from 'react';
import { Check } from 'lucide-react';

export const Stepper = ({ steps, currentStep }: any) => {
  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:flex items-center justify-between w-full relative mb-8">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2">
          <div className="w-full h-1 bg-gray-200 rounded-full"></div>
          <div 
            className="absolute left-0 top-0 h-1 bg-[#bbf7d0] rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
        
        {steps.map((step: any, index: number) => {
          const isCompleted = index + 1 < currentStep;
          const isCurrent = index + 1 === currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center group relative z-10 w-12 shrink-0">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 shadow-sm
                  ${isCompleted ? 'bg-[#bbf7d0] text-gray-900' : isCurrent ? 'bg-[#bbf7d0] text-gray-900 ring-4 ring-green-100' : 'bg-white text-gray-400 border-2 border-gray-200'}`}
              >
                {isCompleted ? <Check size={18} /> : (index + 1)}
              </div>
              <span className={`absolute mt-12 w-28 text-center text-xs font-bold uppercase tracking-wide
                ${(isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Version (Scrollable with explicit step badge) */}
      <div className="flex md:hidden flex-col gap-3 w-full">
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
              Step {currentStep} of {steps.length}: <span className="text-emerald-700 font-extrabold">{steps[currentStep - 1]?.label}</span>
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {Math.round((currentStep / steps.length) * 100)}% Done
          </span>
        </div>

        <div className="flex w-full overflow-x-auto pb-6 pt-2 hide-scrollbar scroll-smooth touch-pan-x">
          <div className="flex items-center justify-between w-full min-w-[700px] relative px-6">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2">
              <div className="w-full h-1 bg-gray-200 rounded-full -z-10"></div>
              <div 
                className="absolute left-0 top-0 h-1 bg-[#bbf7d0] rounded-full transition-all duration-500 ease-in-out -z-10"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
            
            {steps.map((step: any, index: number) => {
              const isCompleted = index + 1 < currentStep;
              const isCurrent = index + 1 === currentStep;
              
              return (
                <div key={index} className="flex flex-col items-center group relative z-10 w-12 shrink-0">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 shadow-sm
                      ${isCompleted ? 'bg-[#bbf7d0] text-gray-900' : isCurrent ? 'bg-[#bbf7d0] text-gray-900 ring-4 ring-green-100' : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                  >
                    {isCompleted ? <Check size={18} /> : (index + 1)}
                  </div>
                  <span className={`absolute mt-12 w-24 text-center text-[10px] font-bold uppercase tracking-wide
                    ${(isCompleted || isCurrent) ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

