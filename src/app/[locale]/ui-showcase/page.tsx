'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageContainer } from '@/components/layout/PageContainer';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useToast } from '@/components/ui/Toast';
import { Mail, Shield, CheckCircle, Info, AlertTriangle, UserPlus, Flame } from 'lucide-react';

export default function UIShowcasePage() {
  const t = useTranslations('states');
  const tCommon = useTranslations('actions');
  const currentLocale = useLocale();

  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const [simulatedOffline, setSimulatedOffline] = useState(false);

  const handleInputCheck = (val: string) => {
    setInputValue(val);
    if (val.length < 3) {
      setInputError('ต้องมีอย่างน้อย 3 ตัวอักษร / Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  const handleToastTrigger = (type: 'success' | 'error' | 'info') => {
    const messages = {
      success: currentLocale === 'th' ? 'บันทึกข้อมูลเรียบร้อยแล้ว!' : 'Data saved successfully!',
      error: currentLocale === 'th' ? 'การบันทึกข้อมูลล้มเหลว' : 'Failed to save data.',
      info: currentLocale === 'th' ? 'มีข่าวสารการอัปเดตระบบใหม่' : 'New system update available.',
    };
    toast(messages[type], type);
  };

  const selectOptions = [
    { value: 'th', label: 'ภาษาไทย (TH)' },
    { value: 'en', label: 'English (EN)' },
    { value: 'jp', label: '日本語 (JP)' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Offline Banner indicator */}
      <OfflineBanner />

      {/* Header Layout */}
      <Header />

      {/* Main Page Content */}
      <main id="main-content" className="flex-1 py-10">
        <PageContainer>
          <div className="border-b border-text-secondary/15 pb-6 mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
              {currentLocale === 'th' ? 'คลังส่วนประกอบ UI (UI Showcase)' : 'UI Primitive Library Showcase'}
            </h1>
            <p className="mt-2 text-base text-text-secondary">
              {currentLocale === 'th'
                ? 'หน้าแสดงผลการทดสอบส่วนประกอบพื้นฐานของระบบ ทรงประสิทธิภาพ สวยงาม มีระเบียบ รองรับสองภาษาและโหมดมืด'
                : 'A showcase of all foundational design system components, layouts, error controls, and responsive tiers.'}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar component */}
            <div className="lg:w-64 shrink-0">
              <Sidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
            </div>

            {/* Showcase details area */}
            <div className="flex-1 space-y-12">
              {/* BUTTONS SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  1. Buttons Primitive
                </h2>
                <div className="flex flex-wrap gap-4 items-center bg-bg-card p-6 border border-text-secondary/10 rounded-2xl">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center bg-bg-card p-6 border border-text-secondary/10 rounded-2xl">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
              </section>

              {/* INPUT & CONTROLS SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  2. Input & Select Controls
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-card p-6 border border-text-secondary/10 rounded-2xl">
                  <Input
                    label="ชื่อผู้ใช้ (User Name)"
                    placeholder="กรอกชื่อของคุณ / Enter your name"
                    value={inputValue}
                    onChange={(e) => handleInputCheck(e.target.value)}
                    error={inputError}
                    iconLeft={<Mail className="h-4 w-4" />}
                    helperText="กรอกชื่อผู้ใช้สำหรับแสดงในโปรไฟล์ระบบ"
                  />
                  <Select
                    label="เลือกภาษาเริ่มต้น (Select Language)"
                    options={selectOptions}
                    placeholder="-- เลือกภาษา / Select --"
                    defaultValue=""
                  />
                </div>
              </section>

              {/* BADGES SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  3. Badge Primitive
                </h2>
                <div className="flex flex-wrap gap-3 items-center bg-bg-card p-6 border border-text-secondary/10 rounded-2xl">
                  <Badge variant="default" size="sm">Default</Badge>
                  <Badge variant="success" size="sm">Success</Badge>
                  <Badge variant="warning" size="sm">Warning</Badge>
                  <Badge variant="danger" size="sm">Danger</Badge>
                  <Badge variant="info" size="sm">Info</Badge>
                  <Badge variant="bronze" size="sm">Bronze</Badge>
                  <Badge variant="silver" size="sm">Silver</Badge>
                  <Badge variant="gold" size="sm">Gold</Badge>
                  <Badge variant="platinum" size="sm">Platinum</Badge>
                  <Badge variant="elite" size="sm">Elite</Badge>
                </div>
              </section>

              {/* AVATARS SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  4. Avatar Primitive
                </h2>
                <div className="flex flex-wrap gap-6 items-center bg-bg-card p-6 border border-text-secondary/10 rounded-2xl">
                  <Avatar name="John Doe" size="sm" />
                  <Avatar name="Jane Smith" size="md" />
                  <Avatar name="Somchai Dev" size="lg" />
                  <Avatar name="Anuchit Dev" size="xl" />
                  <Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" name="Sara" size="lg" />
                </div>
              </section>

              {/* CARDS & MODALS SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  5. Card & Modal Elements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card hoverEffect>
                    <CardHeader>
                      <CardTitle>ซอฟต์แวร์ประมวลผลคำ</CardTitle>
                      <CardDescription>เครื่องมือพิมพ์และแก้ไขเอกสารสำหรับสำนักงานยุคใหม่</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary">
                        รองรับการทำงานร่วมกันแบบเรียลไทม์ ฟอนต์ภาษาไทยสมบูรณ์แบบ ทำงานออฟไลน์ และส่งออกไฟล์ PDF/Docx ได้อย่างไร้รอยต่อ
                      </p>
                    </CardContent>
                    <CardFooter className="justify-between">
                      <Badge variant="gold">แนะนำ / Recommended</Badge>
                      <Button size="sm" onClick={() => setModalOpen(true)}>
                        {currentLocale === 'th' ? 'เปิดดูคู่มือ' : 'Open Manual'}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Modal Component Showcase */}
                <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="รายละเอียดคู่มือการใช้งาน">
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed">
                      นี่คือ Modal ตัวอย่างที่ได้รับการเรนเดอร์ผ่าน React Portal และครอบคลุมพฤติกรรม Accessibility อย่างครบถ้วน:
                    </p>
                    <ul className="list-disc list-inside text-xs text-text-secondary space-y-1.5 pl-2">
                      <li>กดปุ่ม ESC บนแป้นพิมพ์เพื่อปิดหน้าต่าง</li>
                      <li>ล็อกการเลื่อนตัว (scroll locking) ในหน้าหลักเบื้องหลัง</li>
                      <li>ดักจับคีย์บอร์ดการย้ายโฟกัส (Focus Trap) ให้อยู่เฉพาะใน Modal นี้</li>
                      <li>คลิกพื้นที่รอบนอกสีดำจางเพื่อปิดหน้าต่างลงได้ทันที</li>
                    </ul>
                    <div className="flex justify-end gap-3 pt-4 border-t border-text-secondary/10">
                      <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                        {tCommon('cancel')}
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                        {tCommon('confirm')}
                      </Button>
                    </div>
                  </div>
                </Modal>
              </section>

              {/* SKELETONS & STATES SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  6. Skeleton Loading & Layout Placeholders
                </h2>
                <div className="space-y-6 bg-bg-card p-6 border border-text-secondary/10 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary mb-3">Skeleton Primitives (Text, circle, rectangle)</h3>
                    <div className="flex items-center gap-4">
                      <Skeleton variant="circle" className="h-10 w-10" />
                      <div className="flex-1 space-y-2">
                        <Skeleton variant="text" className="h-3 w-1/3" />
                        <Skeleton variant="text" className="h-3 w-3/4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-text-secondary mb-3">LoadingSkeleton Presets (Grid & List View)</h3>
                    <LoadingSkeleton variant="list" count={2} />
                  </div>
                </div>
              </section>

              {/* TOASTS TRIGGER SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  7. Toast Alerts
                </h2>
                <div className="flex flex-wrap gap-4 items-center bg-bg-card p-6 border border-text-secondary/10 rounded-2xl">
                  <Button variant="outline" onClick={() => handleToastTrigger('success')}>
                    Trigger Success Toast
                  </Button>
                  <Button variant="outline" onClick={() => handleToastTrigger('error')}>
                    Trigger Error Toast
                  </Button>
                  <Button variant="outline" onClick={() => handleToastTrigger('info')}>
                    Trigger Info Toast
                  </Button>
                </div>
              </section>

              {/* UX SYSTEM STATE BLOCK SECTION */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold border-b border-text-secondary/5 pb-2 text-text-primary">
                  8. Full UX Layout States (Empty, Error, Offline)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Empty State */}
                  <EmptyState
                    title={t('empty')}
                    description="ระบบไม่พบรายการซอฟต์แวร์ที่คุณกำลังค้นหา โปรดลองเริ่มสร้างซอฟต์แวร์ใหม่เพื่อโปรโมตในแพลตฟอร์ม"
                    actionLabel="เพิ่มซอฟต์แวร์ตอนนี้"
                    onAction={() => toast('Redirecting to create form...', 'info')}
                  />

                  {/* Error State */}
                  <ErrorState
                    title={t('error')}
                    message="การดึงข้อมูลจากฐานข้อมูล Firebase เสียหาย โปรดเชื่อมต่อสัญญาณเครือข่ายอีกครั้ง"
                    onRetry={() => handleToastTrigger('info')}
                  />
                </div>
              </section>
            </div>
          </div>
        </PageContainer>
      </main>

      {/* Footer Layout */}
      <Footer />
    </div>
  );
}
