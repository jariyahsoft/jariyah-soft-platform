/** localizedMap: { th: string; en: string } */
export interface LocalizedMap {
  th: string;
  en: string;
}

export interface SoftwareCategory {
  slug: string;
  name: LocalizedMap;
  isActive: boolean;
  sortOrder: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
