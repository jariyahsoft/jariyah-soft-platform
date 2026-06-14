'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useLocale } from 'next-intl';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ReputationBadge } from '@/components/software/ReputationBadge';
import { BadgeGrid } from '@/components/software/BadgeGrid';
import { 
  ShieldAlert, AlertCircle, Save,
  X, Link as LinkIcon, Camera, ExternalLink, CheckCircle2
} from 'lucide-react';
import { Link } from '@/i18n/routing';

type GithubVerificationState = 'idle' | 'checking' | 'verified' | 'invalid' | 'error';

type GithubProfileSummary = {
  username: string;
  profileUrl: string;
  avatarUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  repositories: Array<{
    name: string;
    htmlUrl: string;
    description: string;
    language: string;
  }>;
};

type DeveloperDocData = {
  displayName?: string;
  slug?: string;
  bio?: string;
  skills?: string[];
  githubUsername?: string;
  githubProfile?: GithubProfileSummary | null;
  websiteURL?: string;
  coverURL?: string;
  socialLinks?: {
    linkedin?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    youtube?: string | null;
  };
  reputationScore?: number;
  followerCount?: number;
  verificationStatus?: string;
};

export default function ProfileEditPage() {
  const locale = useLocale();
  const { toast } = useToast();
  
  // 1. Auth Guard - Require at least developer role
  const { loading: guardLoading } = useAuthGuard({ requiredRole: 'developer' });
  const { user } = useAuth();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [githubUsername, setGithubUsername] = useState('');
  const [websiteURL, setWebsiteURL] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [coverURL, setCoverURL] = useState('');
  const [githubProfile, setGithubProfile] = useState<GithubProfileSummary | null>(null);
  const [githubVerification, setGithubVerification] = useState<GithubVerificationState>('idle');
  const [githubVerificationMessage, setGithubVerificationMessage] = useState('');

  // Read-only states
  const [reputationScore, setReputationScore] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const earnedBadges: Array<{ badgeId: string; awardedAt?: string | null }> = [];

  // UI state
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const normalizedGithubUsername = githubUsername.trim().replace(/^@/, '');
  const githubUsernameIsValid = !normalizedGithubUsername || /^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i.test(normalizedGithubUsername);
  const githubProfilePreview = githubUsernameIsValid ? githubProfile : null;
  const slugIsValid = slug.length < 2 ? null : slugPattern.test(slug);

  // Fetch initial profile data
  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        const [devSnap, userSnap] = await Promise.all([
          getDoc(doc(db, 'developers', user.uid)),
          getDoc(doc(db, 'users', user.uid)),
        ]);

        const devData = devSnap.data() as DeveloperDocData | undefined;
        const userData = (userSnap.data() || {}) as { displayName?: string; photoURL?: string };

        // Populate fields
        setDisplayName(devData?.displayName || userData.displayName || '');
        setSlug(devData?.slug || '');
        setBio(devData?.bio || '');
        setSkills(Array.isArray(devData?.skills) ? devData.skills : []);
        setGithubUsername(devData?.githubUsername || '');
        setWebsiteURL(devData?.websiteURL || '');
        setPhotoURL(userData.photoURL || '');
        setCoverURL(devData?.coverURL || '');
        setGithubProfile(devData?.githubProfile || null);
        setGithubVerification(devData?.githubProfile ? 'verified' : 'idle');

        const social = devData?.socialLinks || {};
        setLinkedin(social.linkedin || '');
        setTwitter(social.twitter || '');
        setFacebook(social.facebook || '');
        setYoutube(social.youtube || '');

        // Populate read-only stats
        setReputationScore(Number(devData?.reputationScore ?? 0));
        setFollowerCount(Number(devData?.followerCount ?? 0));
        setVerificationStatus(devData?.verificationStatus || 'unverified');

      } catch (err) {
        console.error('Failed to load profile data', err);
        toast(locale === 'th' ? 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้' : 'Failed to load profile data', 'error');
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchProfileData();
  }, [user, locale, toast]);

  useEffect(() => {
    if (!normalizedGithubUsername || !githubUsernameIsValid) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setGithubVerification('checking');
        setGithubVerificationMessage('');
        setGithubProfile(null);
        const response = await fetch(`/api/v1/developers/github?username=${encodeURIComponent(normalizedGithubUsername)}`);
        const body = await response.json().catch(() => null);

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setGithubProfile(null);
          setGithubVerification('invalid');
          setGithubVerificationMessage(
            body?.error?.fields?.[0]?.reason ||
              body?.error?.message ||
              (locale === 'th' ? 'ไม่พบโปรไฟล์ GitHub' : 'GitHub profile not found')
          );
          return;
        }

        const profile = body?.data?.profile;
        if (profile) {
          setGithubProfile({
            username: profile.username || normalizedGithubUsername,
            profileUrl: profile.profileUrl || `https://github.com/${normalizedGithubUsername}`,
            avatarUrl: profile.avatarUrl || '',
            followers: Number(profile.followers ?? 0),
            following: Number(profile.following ?? 0),
            publicRepos: Number(profile.publicRepos ?? 0),
            repositories: Array.isArray(profile.repositories) ? profile.repositories : [],
          });
          setGithubVerification('verified');
          setGithubVerificationMessage(locale === 'th' ? 'ยืนยันโปรไฟล์ GitHub แล้ว' : 'GitHub profile verified');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('GitHub verification failed', error);
          setGithubProfile(null);
          setGithubVerification('error');
          setGithubVerificationMessage(locale === 'th' ? 'ตรวจสอบ GitHub ไม่สำเร็จ' : 'Unable to verify GitHub right now');
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedGithubUsername, githubUsernameIsValid, locale]);

  // Skills input helpers
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = skillInput.trim().replace(/,/g, '');
      if (clean && !skills.includes(clean)) {
        if (skills.length >= 30) {
          toast(locale === 'th' ? 'สามารถเพิ่มทักษะได้สูงสุด 30 รายการ' : 'Maximum of 30 skills allowed', 'error');
          return;
        }
        setSkills([...skills, clean]);
        setSkillInput('');
      }
    }
  };

  const removeSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, idx) => idx !== indexToRemove));
  };

  // Canvas-based square image cropping for avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast(locale === 'th' ? 'ขนาดไฟล์รูปโปรไฟล์ต้องไม่เกิน 5 MB' : 'Avatar must be less than 5 MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      const img = new Image();
      img.src = imgUrl;
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Crop square from center
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
          canvas.toBlob(async (blob) => {
            if (blob && user) {
              const croppedFile = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
              setIsUploadingAvatar(true);
              try {
                const path = `avatars/${user.uid}/${Date.now()}-avatar.jpg`;
                const storageRef = ref(storage, path);
                await uploadBytes(storageRef, croppedFile);
                const url = await getDownloadURL(storageRef);
                setPhotoURL(url);
                toast(locale === 'th' ? 'อัปโหลดรูปโปรไฟล์สำเร็จ' : 'Avatar uploaded successfully', 'success');
              } catch (err) {
                console.error(err);
                toast(locale === 'th' ? 'อัปโหลดรูปโปรไฟล์ล้มเหลว' : 'Failed to upload avatar', 'error');
              } finally {
                setIsUploadingAvatar(false);
              }
            }
          }, 'image/jpeg', 0.9);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Cover photo upload
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast(locale === 'th' ? 'ขนาดไฟล์รูปหน้าปกต้องไม่เกิน 10 MB' : 'Cover image must be less than 10 MB', 'error');
      return;
    }

    setIsUploadingCover(true);
    try {
      const path = `covers/${user.uid}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCoverURL(url);
      toast(locale === 'th' ? 'อัปโหลดรูปหน้าปกสำเร็จ' : 'Cover image uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      toast(locale === 'th' ? 'อัปโหลดรูปหน้าปกล้มเหลว' : 'Failed to upload cover image', 'error');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Submit Profile Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/v1/developers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName,
          slug,
          bio,
          skills,
          githubUsername: githubUsername || null,
          websiteURL: websiteURL || null,
          socialLinks: {
            linkedin: linkedin || null,
            twitter: twitter || null,
            facebook: facebook || null,
            youtube: youtube || null,
          },
          photoURL: photoURL || null,
          coverURL: coverURL || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save changes');
      }

      toast(locale === 'th' ? 'บันทึกโปรไฟล์สำเร็จ' : 'Profile updated successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : locale === 'th' ? 'บันทึกโปรไฟล์ล้มเหลว' : 'Failed to update profile';
      console.error(err);
      toast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (guardLoading || isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-2 border-b border-text-secondary/10 pb-4">
          <h1 className="text-3xl font-black text-text-primary">
            {locale === 'th' ? 'จัดการโปรไฟล์นักพัฒนา' : 'Developer Profile Settings'}
          </h1>
          <p className="text-sm text-text-secondary">
            {locale === 'th' 
              ? 'ปรับแต่งโปรไฟล์สาธารณะ ทักษะ ลิงก์โซเชียลมีเดีย และตรวจสอบคะแนนของคุณ' 
              : 'Customise your public profile, skills, social links and view stats.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          
          {/* Main Editing Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Visual Cover and Avatar Uploader */}
            <div className="rounded-2xl border border-text-secondary/10 bg-bg-card overflow-hidden shadow-sm">
              {/* Cover uploader */}
              <div className="relative h-44 sm:h-52 bg-bg-secondary flex items-center justify-center">
                {coverURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60" />
                )}
                
                <label className="absolute right-4 bottom-4 cursor-pointer flex items-center gap-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-semibold py-1.5 px-3 transition-colors select-none">
                  <Camera className="h-4 w-4" />
                  <span>{locale === 'th' ? 'เปลี่ยนหน้าปก' : 'Change Cover'}</span>
                  <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" disabled={isUploadingCover} />
                </label>
                {isUploadingCover && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold">
                    {locale === 'th' ? 'กำลังอัปโหลด...' : 'Uploading Cover...'}
                  </div>
                )}
              </div>

              {/* Avatar Uploader Overlay */}
              <div className="relative px-6 pb-6 pt-14">
                <div className="absolute -top-14 left-6 shrink-0 group">
                  <div className="relative h-24 w-24 rounded-2xl overflow-hidden ring-4 ring-bg-card bg-bg-card shadow-md">
                    <Avatar name={displayName} src={photoURL || undefined} size="xl" className="h-full w-full object-cover" />
                    
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity duration-200 select-none">
                      <Camera className="h-5 w-5 mb-1" />
                      <span>{locale === 'th' ? 'เปลี่ยนรูป' : 'Change'}</span>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={isUploadingAvatar} />
                    </label>
                  </div>
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white text-[10px] font-bold">
                      Loading...
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label htmlFor="displayName" className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                      {locale === 'th' ? 'ชื่อที่แสดง' : 'Display Name'} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>

                  {/* Slug Edit */}
                  <div>
                    <label htmlFor="slug" className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                      {locale === 'th' ? 'สลักประจำตัว (Slug)' : 'Profile Slug'} <span className="text-danger">*</span>
                    </label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 rounded-xl bg-bg-secondary text-xs text-text-secondary font-mono border border-text-secondary/10">
                        /developers/
                      </span>
                      <input
                        type="text"
                        id="slug"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="flex-1 bg-bg-secondary text-text-primary text-sm font-mono border border-text-secondary/10 rounded-xl px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      />
                    </div>
                    {slugIsValid === false && (
                      <p className="mt-1.5 text-xs text-danger flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {locale === 'th' ? 'สลักไม่ถูกต้อง หรือถูกใช้งานไปแล้ว' : 'Slug invalid, taken, or contains illegal characters.'}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-text-secondary">
                      {locale === 'th'
                        ? 'ใช้อักษรภาษาอังกฤษตัวเล็ก ตัวเลข และขีดกลาง (-) เท่านั้น ระบบจะสร้างหน้า Redirect 301 จากสลักเก่าให้อัตโนมัติเมื่อทำการเปลี่ยนแปลง'
                        : 'Use only lowercase letters, numbers, and hyphens. Changing this creates an automatic 301 redirect map.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Biography & Skills tag input */}
            <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
              <div>
                <label htmlFor="bio" className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                  {locale === 'th' ? 'คำแนะนำตัว (Bio)' : 'Biography'}
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  maxLength={2000}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={locale === 'th' ? 'เขียนอธิบายเกี่ยวกับประวัติการทำงาน หรือเรื่องเด่น ๆ ของคุณ...' : 'Write about your background, projects, or interests...'}
                  className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-y"
                />
                <span className="block text-right text-[10px] text-text-secondary mt-1">
                  {bio.length}/2,000
                </span>
              </div>

              {/* Skills custom Tags Input */}
              <div>
                <label htmlFor="skills" className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5">
                  {locale === 'th' ? 'ทักษะและความสามารถ (สูงสุด 30 อย่าง)' : 'Skills & Tags (Max 30)'}
                </label>
                <div className="w-full bg-bg-secondary border border-text-secondary/10 rounded-xl p-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-accent/40 focus-within:border-accent">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {skills.map((skill, index) => (
                      <span key={skill} className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent border border-accent/15">
                        {skill}
                        <button type="button" onClick={() => removeSkill(index)} className="hover:text-danger">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    id="skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder={locale === 'th' ? 'พิมพ์ทักษะแล้วกด Enter หรือเครื่องหมายจุลภาค (,)' : 'Type skill and press Enter or comma'}
                    className="w-full bg-transparent text-text-primary text-sm focus:outline-none px-2 py-1"
                  />
                </div>
              </div>
            </div>

            {/* Social Links Form Block */}
            <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4" />
                {locale === 'th' ? 'ลิงก์และช่องทางโซเชียลมีเดีย' : 'Social & External Links'}
              </h3>
              <p className="text-xs text-text-secondary">
                {locale === 'th' 
                  ? 'ลิงก์ต้องขึ้นต้นด้วย https:// และอยู่ในรายชื่อผู้ให้บริการที่อนุญาตเท่านั้น' 
                  : 'Links must begin with https:// and belong to allowlisted domains.'}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* GitHub Integration Basic input */}
                <div>
                  <label htmlFor="githubUsername" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    GitHub Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="githubUsername"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="username"
                      className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                  <p className={`mt-1.5 text-[11px] ${githubVerification === 'verified' ? 'text-success' : githubVerification === 'invalid' || githubVerification === 'error' ? 'text-danger' : 'text-text-secondary'}`}>
                    {!normalizedGithubUsername
                      ? locale === 'th'
                        ? 'ระบบจะตรวจสอบบัญชี GitHub สาธารณะและแสดงสถิติให้เมื่อยืนยันแล้ว'
                        : 'We verify the public GitHub account and show stats after confirmation.'
                      : !githubUsernameIsValid
                        ? locale === 'th'
                          ? 'ชื่อผู้ใช้ GitHub ไม่ถูกต้อง'
                          : 'Invalid GitHub username'
                        : githubVerification === 'checking'
                          ? locale === 'th'
                            ? 'กำลังตรวจสอบ GitHub...'
                            : 'Verifying GitHub...'
                          : githubVerificationMessage ||
                            (locale === 'th'
                              ? 'ระบบจะตรวจสอบบัญชี GitHub สาธารณะและแสดงสถิติให้เมื่อยืนยันแล้ว'
                              : 'We verify the public GitHub account and show stats after confirmation.')}
                  </p>
                </div>

                {/* Personal Website */}
                <div>
                  <label htmlFor="websiteURL" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Website URL
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="websiteURL"
                      value={websiteURL}
                      onChange={(e) => setWebsiteURL(e.target.value)}
                      placeholder="https://mywebsite.com"
                      className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div>
                  <label htmlFor="linkedin" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    LinkedIn
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                </div>

                {/* Twitter / X */}
                <div>
                  <label htmlFor="twitter" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Twitter / X
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="twitter"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/username"
                      className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div>
                  <label htmlFor="facebook" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    Facebook
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="facebook"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="https://facebook.com/username"
                      className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                </div>

                {/* YouTube */}
                <div>
                  <label htmlFor="youtube" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                    YouTube
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="youtube"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="https://youtube.com/c/channel"
                      className="w-full bg-bg-secondary text-text-primary text-sm border border-text-secondary/10 rounded-xl px-4 py-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {githubProfilePreview && githubVerification === 'verified' && (
                <div className="rounded-2xl border border-text-secondary/10 bg-bg-secondary p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        GitHub
                      </p>
                      <p className="mt-1 text-sm font-bold text-text-primary">
                        {githubProfilePreview.username}
                      </p>
                    </div>
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-text-secondary/10 bg-bg-card p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Repositories
                      </div>
                      <div className="mt-1 text-lg font-black text-text-primary">
                        {githubProfilePreview.publicRepos.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl border border-text-secondary/10 bg-bg-card p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Followers
                      </div>
                      <div className="mt-1 text-lg font-black text-text-primary">
                        {githubProfilePreview.followers.toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-xl border border-text-secondary/10 bg-bg-card p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Following
                      </div>
                      <div className="mt-1 text-lg font-black text-text-primary">
                        {githubProfilePreview.following.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {githubProfilePreview.repositories.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Repo suggestions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {githubProfilePreview.repositories.slice(0, 3).map((repo) => (
                          <a
                            key={repo.htmlUrl}
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-text-secondary/10 bg-bg-card px-3 py-1 text-xs font-semibold text-text-primary transition-colors hover:border-accent/25 hover:text-accent"
                          >
                            {repo.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  {locale === 'th' ? 'ย้อนกลับ' : 'Back'}
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                  disabled={
                    isSaving ||
                    slugIsValid === false ||
                    (normalizedGithubUsername ? !githubUsernameIsValid : false) ||
                    githubVerification === 'checking' ||
                    githubVerification === 'invalid'
                  }
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (locale === 'th' ? 'บันทึกโปรไฟล์' : 'Save Profile')}
              </Button>
            </div>

          </div>

          {/* Right Column: Read-Only Stats panel */}
          <div className="space-y-6">
            
            {/* Stats Summary Box */}
            <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-text-secondary/5 pb-2">
                {locale === 'th' ? 'สถิติของนักพัฒนา (อ่านอย่างเดียว)' : 'Developer Stats (Read-Only)'}
              </h3>

              <div className="space-y-4">
                {/* Reputation */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">Reputation Score</span>
                  <div className="flex items-center gap-1.5">
                    <ReputationBadge score={reputationScore} />
                    <span className="text-sm font-black text-text-primary">{reputationScore.toLocaleString()}</span>
                  </div>
                </div>

                {/* Followers */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">Followers</span>
                  <span className="text-sm font-black text-text-primary">{followerCount.toLocaleString()}</span>
                </div>

                {/* Verification Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary font-medium">Verification Status</span>
                  <Badge variant={verificationStatus === 'verified' ? 'success' : verificationStatus === 'pending' ? 'warning' : 'default'} size="sm">
                    {verificationStatus}
                  </Badge>
                </div>
              </div>
              
              <div className="text-[11px] text-text-secondary leading-relaxed bg-bg-secondary/50 rounded-xl p-3 border border-text-secondary/5 flex gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-accent shrink-0" />
                <span>
                  {locale === 'th'
                    ? 'สถิติและสถานะการตรวจสอบเหล่านี้ประมวลผลโดยอัตโนมัติจากฝั่งเซิร์ฟเวอร์ ไม่สามารถแก้ไขด้วยตนเองได้'
                    : 'These statistics and verification steps are maintained server-side and cannot be directly edited.'}
                </span>
              </div>
            </div>

            {/* Badges Box */}
            <div className="rounded-2xl border border-text-secondary/10 bg-bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-text-secondary/5 pb-2">
                {locale === 'th' ? 'เหรียญรางวัลของคุณ' : 'Your Badges'}
              </h3>

              <BadgeGrid earnedBadges={earnedBadges} />
            </div>

          </div>

        </form>

      </div>
    </main>
  );
}
