'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Sparkles, MessageSquare, Code } from 'lucide-react';

interface ApplyButtonProps {
  projectId: string;
  projectName: string;
  locale: 'th' | 'en';
  onSuccess?: () => void;
}

export function ApplyButton({ projectId, projectName, locale, onSuccess }: ApplyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleOpen = () => {
    setIsOpen(true);
    setMessage('');
    setSkillsInput('');
  };

  const handleClose = () => {
    if (!loading) {
      setIsOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (message.length < 10) {
      toast(
        locale === 'th'
          ? 'ข้อความแนะนำตัวต้องมีความยาวอย่างน้อย 10 ตัวอักษร'
          : 'Message must be at least 10 characters long',
        'error'
      );
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (skills.length === 0) {
      toast(
        locale === 'th'
          ? 'กรุณากรอกทักษะที่เกี่ยวข้องอย่างน้อย 1 อย่าง'
          : 'Please enter at least one relevant skill',
        'error'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/v1/incubator/${projectId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, skills }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      toast(
        locale === 'th'
          ? 'ส่งใบสมัครของคุณเรียบร้อยแล้ว!'
          : 'Your application has been submitted successfully!',
        'success'
      );

      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast(err.message || 'An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={handleOpen}
        className="relative group overflow-hidden font-semibold flex items-center gap-2 shadow-lg"
      >
        <Sparkles className="h-4 w-4 text-white group-hover:animate-pulse" />
        <span>{locale === 'th' ? 'สมัครเข้าร่วมทีม' : 'Join this Project'}</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={locale === 'th' ? `ร่วมทีมกับ ${projectName}` : `Join ${projectName}`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              {locale === 'th' ? 'ทำไมคุณถึงต้องการเข้าร่วมโครงการนี้?' : 'Why do you want to join?'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-lg border border-text-secondary/20 bg-transparent px-3 py-2 text-sm placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-all duration-200"
              placeholder={
                locale === 'th'
                  ? 'แนะนำตัวเอง ประสบการณ์ และแรงบันดาลใจในการร่วมโครงการนี้...'
                  : 'Introduce yourself, your experience, and motivation for joining this project...'
              }
              required
              disabled={loading}
            />
            <div className="text-right text-[10px] text-text-secondary/60">
              {message.length} / 1000 {locale === 'th' ? 'ตัวอักษร' : 'characters'}
            </div>
          </div>

          {/* Skills Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5" />
              {locale === 'th' ? 'ทักษะที่เกี่ยวข้องของคุณ (แยกด้วยเครื่องหมายจุลภาค ,)' : 'Your Relevant Skills (separated by commas)'}
            </label>
            <Input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder={
                locale === 'th'
                  ? 'เช่น React, TypeScript, Node.js, UI Design'
                  : 'e.g. React, TypeScript, Node.js, UI Design'
              }
              required
              disabled={loading}
            />
            <p className="text-[11px] text-text-secondary/60">
              {locale === 'th'
                ? 'กรอกทักษะที่คุณจะนำมาใช้ในโครงการนี้'
                : 'Enter the skills you bring to the table for this project'}
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-text-secondary/5">
            <Button variant="ghost" onClick={handleClose} type="button" disabled={loading}>
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              {locale === 'th' ? 'ส่งใบสมัคร' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
