export type SoftwareStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'hidden' | 'suspended' | 'removed' | 'archived';

export interface SoftwareItem {
  id: string;
  ownerId?: string;
  name: string;
  slug: string;
  developerName: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  tagIds: string[];
  platforms: string[];
  licenseId: string;
  licenseName: string;
  logoPath?: string;
  screenshotPaths: string[];
  repositoryURL?: string;
  websiteURL?: string;
  downloadURL?: string;
  fileSize?: string;
  latestVersion?: string;
  releaseNotes?: string;
  status: SoftwareStatus;
  ratingAverage: number;
  ratingCount: number;
  downloadCount: number;
  certifications?: string[];
  license?: string;
  publishedAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
  etag?: string;
}

export interface SoftwareReviewSummary {
  ratingAverage: number;
  ratingCount: number;
}

export interface SoftwareCategory {
  id: string;
  slug: string;
  name: string;
}

export interface SoftwareLicense {
  id: string;
  name: string;
}

export const PLATFORM_LABELS: Record<string, string> = {
  windows: 'Windows',
  mac: 'Mac',
  web: 'Web',
  mobile: 'Mobile',
  linux: 'Linux',
};

export const SOFTWARE_CATEGORIES: SoftwareCategory[] = [
  { id: 'productivity', slug: 'productivity', name: 'Productivity' },
  { id: 'education', slug: 'education', name: 'Education' },
  { id: 'developer-tools', slug: 'developer-tools', name: 'Developer Tools' },
  { id: 'business', slug: 'business', name: 'Business' },
  { id: 'creative', slug: 'creative', name: 'Creative' },
];

export const SOFTWARE_LICENSES: SoftwareLicense[] = [
  { id: 'MIT', name: 'MIT' },
  { id: 'Apache-2.0', name: 'Apache-2.0' },
  { id: 'GPL-3.0', name: 'GPL-3.0' },
  { id: 'Proprietary', name: 'Proprietary' },
  { id: 'Other', name: 'Other' },
];
