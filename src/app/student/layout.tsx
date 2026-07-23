"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Landmark, Mail, Phone, User } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [student, setStudent] = useState<any>(null);
  
  // Initialize strictly based on usePathname to ensure Server SSR matching Client Hydration symmetrically
  const [showNavbar, setShowNavbar] = useState(!(pathname === '/student/form' || pathname === '/student'));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStudent(JSON.parse(localStorage.getItem('activeStudent') || 'null'));
    }

    const handleScroll = () => {
      if (pathname === '/student/form' || pathname === '/student') {
        // Form starts around 2.5 screens down. Hide the navbar before that, show it after
        if (window.scrollY > window.innerHeight * 2.5) {
          setShowNavbar(true);
        } else {
          setShowNavbar(false);
        }
      } else {
        setShowNavbar(true);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col antialiased" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />
      <header className={`bg-white border-b border-gray-200 py-2 sm:py-3 shadow-sm w-full fixed top-0 z-[100] transition-transform duration-500 ease-in-out ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-[1800px] w-full mx-auto flex items-center justify-between px-3 md:px-8">
          {/* Left Side: Logo & Institution Name */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <img
              src="/psna.png"
              alt="PSNA Logo"
              className="h-10 sm:h-16 md:h-20 w-auto object-contain shrink-0"
            />
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="text-sm sm:text-xl md:text-[26px] font-black tracking-tight text-black leading-tight flex items-center mb-0.5" style={{ fontFamily: '"Arial", sans-serif' }}>
                PSNA
              </h1>
              <h2 className="text-[10px] sm:text-sm md:text-[15px] font-bold text-black uppercase tracking-wide leading-tight mt-0.5 truncate">
                COLLEGE OF ENGINEERING & TECHNOLOGY
              </h2>
              <span className="text-[9px] sm:text-[11px] md:text-sm font-bold text-black mt-0.5 tracking-wide truncate">
                (An Autonomous Institution)
              </span>
              <div className="h-[1.5px] sm:h-[2px] w-full bg-black mt-0.5 mb-0.5 hidden sm:block" />
              <span className="text-[8px] sm:text-[10px] md:text-[11px] font-extrabold text-black tracking-widest uppercase hidden sm:block">
                AICTE | Anna University | NBA | NAAC A++
              </span>
            </div>
          </div>

          {/* Right Side: Contact Details & Profile */}
          <div className="flex items-center gap-3 xl:gap-8 pl-2 sm:pl-4 shrink-0">
            
            {/* Contact Details (Hidden on smaller screens) */}
            <div className="hidden xl:flex items-center gap-8 pr-8 border-r border-gray-200">
              {/* TNEA CODE */}
              <div className="flex items-center gap-3 border-r border-gray-200 pr-8">
                <Landmark className="text-red-700 w-9 h-9" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500 font-bold tracking-wider uppercase mb-0.5">TNEA CODE</span>
                  <span className="text-[19px] font-black text-gray-900 leading-none">5910</span>
                </div>
              </div>
              
              {/* EMAIL */}
              <div className="flex items-center gap-3 border-r border-gray-200 pr-8">
                <Mail className="text-[#0ea5e9] w-9 h-9" strokeWidth={1.5} />
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-bold tracking-wider uppercase mb-0.5">SEND US AN EMAIL</span>
                  <span className="text-[17px] font-bold text-gray-800 leading-none">contact@psnacet.edu.in</span>
                </div>
              </div>

              {/* CALL US NOW */}
              <div className="flex items-center gap-3">
                <div className="bg-transparent rounded-full flex items-center justify-center">
                  <Phone className="text-[#0ea5e9] w-9 h-9" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-bold tracking-wider uppercase mb-0.5">CALL US NOW</span>
                  <span className="text-[17px] font-black text-[#1e293b] leading-none">0451-2554032</span>
                </div>
              </div>
            </div>

            {/* Profile Dropdown (Visible on ALL screens) */}
            <div className="relative group cursor-pointer flex items-center py-2">
              <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gray-50 border border-gray-200 shadow-sm rounded-full flex items-center justify-center z-10 transition-all duration-300 group-hover:bg-gray-100 overflow-hidden">
                  {student?.name ? (
                    <span className="text-base md:text-xl font-bold text-gray-800 transition-transform duration-300 group-hover:scale-110">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] md:text-[24px] text-gray-700 transition-transform duration-300 group-hover:scale-110">account_circle</span>
                  )}
                </div>
                <div className="absolute -right-0 -bottom-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-500 border-2 border-white rounded-full z-20"></div>
                <div className="absolute -right-0 -bottom-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-500 rounded-full z-10 animate-ping opacity-75"></div>
              </div>

              {/* Hover Dropdown */}
              <div className="absolute top-full right-0 mt-3 hidden group-hover:block w-56 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-2 relative before:content-[''] before:absolute before:-top-2 before:right-3 md:before:right-5 before:border-8 before:border-transparent before:border-b-white/90">
                  <div className="px-4 py-3 border-b border-gray-100/50 mb-1">
                    <span className="text-sm font-extrabold text-[#18281e] truncate block">
                      {student?.name || 'Loading Name...'}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Student Account</span>
                  </div>
                  <button 
                    onClick={async () => {
                      await fetch('/api/logout', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'x-session-kind': 'student' },
                      });
                      localStorage.removeItem('activeStudent');
                      window.location.href = '/';
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-all font-bold w-full text-left"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>
      <main className={`flex-1 w-full flex flex-col ${(pathname === '/student/form' || pathname === '/student') ? 'max-w-none p-0 m-0' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-20 sm:pt-24'}`}>
        {children}
      </main>

      {/* Mobile Nav removed as requested */}
    </div>
  );
}
