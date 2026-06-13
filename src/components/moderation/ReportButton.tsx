'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';


interface ReportButtonProps {
  targetType: 'software' | 'article' | 'comment' | 'review';
  targetId: string;
}

const REASON_CODES = [
  { value: 'spam', label: 'สแปม / โฆษณาแฝง' },
  { value: 'harassment', label: 'คุกคาม / สร้างความเกลียดชัง' },
  { value: 'inappropriate', label: 'เนื้อหาไม่เหมาะสม' },
  { value: 'copyright', label: 'ละเมิดลิขสิทธิ์' },
  { value: 'other', label: 'อื่นๆ' }
];

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState('');
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!reasonCode) {
      setError('กรุณาเลือกเหตุผลในการรายงาน');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reasonCode,
          details,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to submit report');
      }

      setIsOpen(false);
      setReasonCode('');
      setDetails('');
      alert('รายงานของคุณถูกส่งแล้ว ขอบคุณที่ช่วยดูแลชุมชน');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        รายงาน
      </Button>

      {isOpen && (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="รายงานเนื้อหา">
          <form onSubmit={handleReport} className="space-y-4">
            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เหตุผล *</label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="" disabled>เลือกเหตุผล...</option>
                {REASON_CODES.map(code => (
                  <option key={code.value} value={code.value}>{code.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ระบุรายละเอียดเพิ่มเติมเพื่อช่วยให้เราตรวจสอบได้เร็วขึ้น"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? 'กำลังส่ง...' : 'ส่งรายงาน'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
