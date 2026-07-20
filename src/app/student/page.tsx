"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type StudentInfo = {
  name?: string;
  applicationNumber?: string;
  branch?: string;
  mobile?: string;
};

type AccessStatus = {
  status: 'active' | 'locked' | 'access_expired';
  message: string;
  isLocked: boolean;
  formSubmitted: boolean;
  accessExpiresAt: string | null;
};

export default function StudentDashboard() {
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const initDoneRef = useRef(false);

  // Initialize student synchronously to avoid loading states on browser navigation
  const getInitialStudent = (): StudentInfo | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('activeStudent');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StudentInfo;
      if (parsed?.name || parsed?.applicationNumber) {
        return parsed;
      }
    } catch {}
    return null;
  };

  const [student] = useState<StudentInfo | null>(getInitialStudent);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    if (!student) {
      router.replace('/');
      return;
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/students/me/status');
        if (!response.ok) {
          setAccessDenied(true);
          return;
        }
        const data: AccessStatus = await response.json();
        setAccessStatus(data);
        if (data.status !== 'active') {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('Failed to check access status:', error);
      }
    };

    if (student && initialized) {
      checkAccess();
    }
  }, [student, initialized]);

  if (!student || !initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#063d30] rounded-full animate-spin" />
          <p className="text-gray-600 text-sm font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (accessDenied && accessStatus) {
    return (
      <div className="max-w-3xl mx-auto pt-28 pb-16 px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-2">
                {accessStatus.status === 'locked' ? 'Application Under Review' : 'Access Restricted'}
              </h2>
              <p className="text-red-800 mb-4">{accessStatus.message}</p>
              <button
                onClick={() => {
                  localStorage.removeItem('activeStudent');
                  router.replace('/');
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-28 pb-16 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">Student portal</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Welcome, {student.name}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          You are signed in with your application number. Your password is based on your date of birth (DDMMYYYY), as issued when you were enrolled.
        </p>
        {accessStatus && accessStatus.status === 'active' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium">{accessStatus.message}</p>
          </div>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Application number</dt>
            <dd className="font-mono font-semibold text-gray-900">{student.applicationNumber || '—'}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Branch</dt>
            <dd className="font-semibold text-gray-900">{student.branch || '—'}</dd>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Mobile</dt>
            <dd className="font-semibold text-gray-900">{student.mobile || '—'}</dd>
          </div>
        </dl>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/student/form"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#063d30] text-white text-sm font-bold hover:bg-[#0a4d3c] transition-colors"
          >
            Open application form
          </a>
        </div>
      </div>
    </div>
  );
}
