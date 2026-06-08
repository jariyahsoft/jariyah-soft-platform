import type { LocalizedMap, SoftwareCategory } from './types';

export const softwareCategories: Omit<SoftwareCategory, 'createdAt' | 'updatedAt'>[] = [
  { slug: 'productivity',   name: { th: 'เพิ่มผลผลิต',                en: 'Productivity' },           isActive: true, sortOrder: 1 },
  { slug: 'development',    name: { th: 'พัฒนาซอฟต์แวร์',            en: 'Development' },             isActive: true, sortOrder: 2 },
  { slug: 'education',      name: { th: 'การศึกษา',                   en: 'Education' },               isActive: true, sortOrder: 3 },
  { slug: 'security',       name: { th: 'ความปลอดภัย',               en: 'Security' },                isActive: true, sortOrder: 4 },
  { slug: 'multimedia',     name: { th: 'มัลติมีเดีย',                en: 'Multimedia' },              isActive: true, sortOrder: 5 },
  { slug: 'utilities',      name: { th: 'ยูทิลิตี้',                  en: 'Utilities' },               isActive: true, sortOrder: 6 },
  { slug: 'communication',  name: { th: 'การสื่อสาร',                 en: 'Communication' },           isActive: true, sortOrder: 7 },
  { slug: 'ai-ml',          name: { th: 'AI และ Machine Learning',   en: 'AI & Machine Learning' },   isActive: true, sortOrder: 8 },
  { slug: 'iot',            name: { th: 'IoT',                        en: 'IoT' },                     isActive: true, sortOrder: 9 },
  { slug: 'other',          name: { th: 'อื่นๆ',                      en: 'Other' },                   isActive: true, sortOrder: 99 },
];

export const articleCategories: Omit<{ slug: string; name: LocalizedMap; isActive: boolean; sortOrder: number }, never>[] = [
  { slug: 'ai',            name: { th: 'AI และ Machine Learning', en: 'AI & Machine Learning' }, isActive: true, sortOrder: 1 },
  { slug: 'windows',       name: { th: 'Windows',                 en: 'Windows' },               isActive: true, sortOrder: 2 },
  { slug: 'linux',         name: { th: 'Linux',                   en: 'Linux' },                 isActive: true, sortOrder: 3 },
  { slug: 'android',       name: { th: 'Android',                 en: 'Android' },               isActive: true, sortOrder: 4 },
  { slug: 'ios',           name: { th: 'iOS',                     en: 'iOS' },                   isActive: true, sortOrder: 5 },
  { slug: 'programming',   name: { th: 'การเขียนโปรแกรม',       en: 'Programming' },            isActive: true, sortOrder: 6 },
  { slug: 'iot',           name: { th: 'IoT',                     en: 'IoT' },                   isActive: true, sortOrder: 7 },
  { slug: 'cybersecurity', name: { th: 'ความปลอดภัยไซเบอร์',   en: 'Cybersecurity' },          isActive: true, sortOrder: 8 },
  { slug: 'open-source',   name: { th: 'โอเพนซอร์ส',             en: 'Open Source' },            isActive: true, sortOrder: 9 },
  { slug: 'productivity',  name: { th: 'เพิ่มผลผลิต',            en: 'Productivity' },           isActive: true, sortOrder: 10 },
];

export const licenses = [
  { spdxId: 'MIT',           name: 'MIT License',          isOpenSource: true  },
  { spdxId: 'Apache-2.0',    name: 'Apache License 2.0',   isOpenSource: true  },
  { spdxId: 'GPL-3.0-only',  name: 'GNU GPL v3',           isOpenSource: true  },
  { spdxId: 'LGPL-3.0-only', name: 'GNU LGPL v3',          isOpenSource: true  },
  { spdxId: 'BSD-2-Clause',  name: 'BSD 2-Clause',         isOpenSource: true  },
  { spdxId: 'BSD-3-Clause',  name: 'BSD 3-Clause',         isOpenSource: true  },
  { spdxId: 'Proprietary',   name: 'Proprietary',          isOpenSource: false },
  { spdxId: 'Other',         name: 'Other',                isOpenSource: false },
];

export const badges = [
  {
    slug: 'first-software',
    name: { th: 'ซอฟต์แวร์แรก', en: 'First Software' },
    description: { th: 'เผยแพร่ซอฟต์แวร์ชิ้นแรก', en: 'Published your first software' },
    iconPath: 'badges/first-software.svg',
    criteria: { type: 'software_count', threshold: 1 },
    isActive: true,
  },
  {
    slug: 'open-source-contributor',
    name: { th: 'ผู้สนับสนุนโอเพนซอร์ส', en: 'Open Source Contributor' },
    description: { th: 'เผยแพร่ซอฟต์แวร์โอเพนซอร์สอย่างน้อย 1 ชิ้น', en: 'Published at least one open source software' },
    iconPath: 'badges/open-source.svg',
    criteria: { type: 'open_source_software_count', threshold: 1 },
    isActive: true,
  },
  {
    slug: 'top-author',
    name: { th: 'นักเขียนยอดนิยม', en: 'Top Author' },
    description: { th: 'บทความได้รับการดูมากกว่า 10,000 ครั้ง', en: 'Article viewed over 10,000 times' },
    iconPath: 'badges/top-author.svg',
    criteria: { type: 'article_views', threshold: 10000 },
    isActive: true,
  },
  {
    slug: 'top-developer',
    name: { th: 'นักพัฒนายอดเยี่ยม', en: 'Top Developer' },
    description: { th: 'ซอฟต์แวร์มียอดดาวน์โหลดรวมมากกว่า 1,000 ครั้ง', en: 'Total software downloads over 1,000' },
    iconPath: 'badges/top-developer.svg',
    criteria: { type: 'total_downloads', threshold: 1000 },
    isActive: true,
  },
  {
    slug: 'community-helper',
    name: { th: 'ผู้ช่วยเหลือชุมชน', en: 'Community Helper' },
    description: { th: 'ตอบคำถามชุมชนอย่างน้อย 50 ครั้ง', en: 'Answered community questions at least 50 times' },
    iconPath: 'badges/community-helper.svg',
    criteria: { type: 'comment_count', threshold: 50 },
    isActive: true,
  },
  {
    slug: 'verified-developer',
    name: { th: 'นักพัฒนาที่ยืนยันแล้ว', en: 'Verified Developer' },
    description: { th: 'ผ่านการยืนยันตัวตนนักพัฒนา', en: 'Completed developer verification' },
    iconPath: 'badges/verified-developer.svg',
    criteria: { type: 'verified_developer', threshold: 1 },
    isActive: true,
  },
];

export const systemSettings = {
  uploadLimits: {
    logo:       { maxSizeBytes: 5  * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'] },
    screenshot: { maxSizeBytes: 10 * 1024 * 1024, allowedTypes: ['image/png', 'image/jpeg', 'image/webp'] },
    pdf:        { maxSizeBytes: 50 * 1024 * 1024, allowedTypes: ['application/pdf'] },
  },
  rateTiers: {
    anonymous:     { requestsPerMinute: 60  },
    authenticated: { requestsPerMinute: 120 },
    mutation:      { requestsPerMinute: 10  },
  },
  moderationSla: {
    software: { days: 7 },
    article:  { days: 3 },
  },
  termsVersion:   '1.0.0',
  privacyVersion: '1.0.0',
};
