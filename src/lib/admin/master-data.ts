export const MASTER_DATA_COLLECTIONS: Record<string, string> = {
  categories: 'software_categories',
  tags: 'software_tags',
  badges: 'badges',
  licenses: 'licenses',
  'system-settings': 'system_settings',
};

export function getMasterDataCollectionName(key: string) {
  return MASTER_DATA_COLLECTIONS[key] || null;
}
