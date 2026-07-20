"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserPlus, Save } from 'lucide-react';

export default function AddStudentPage() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
          <UserPlus size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Register New Student</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Credentials</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Create portal access credentials for the new applicant.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Application Number" placeholder="e.g. APP-2026-001" required />
              <Input label="Student Full Name" placeholder="As per official records" required />
              <Input label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" required />
              <Input label="Father's Name" placeholder="Full Name" required />
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Portal Access</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Temporary Username" placeholder="Create username" required />
                <Input label="Temporary Password" type="password" placeholder="••••••••" required />
              </div>
            </div>

            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-sm font-medium flex items-center">
                Student registered successfully! Credentials have been saved.
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="button" variant="outline" className="mr-3">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? 'Saving...' : <><Save size={18} /> Save Student Record</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
