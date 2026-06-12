import { getTypesenseAdminClient } from './client';
import * as logger from 'firebase-functions/logger';
import { SynonymCreateSchema } from 'typesense/lib/Typesense/Synonyms';

const softwareSynonyms = [
  { id: 'ai', synonyms: ['เอไอ', 'AI', 'ปัญญาประดิษฐ์'] },
  { id: 'opensource', synonyms: ['โอเพนซอร์ส', 'open source', 'โอเพ่นซอร์ส'] },
  { id: 'word', synonyms: ['โปรแกรมพิมพ์งาน', 'word processing', 'word processor'] },
];

export async function configureSynonyms() {
  const client = getTypesenseAdminClient();

  try {
    for (const item of softwareSynonyms) {
      const synonymSchema: SynonymCreateSchema = {
        synonyms: item.synonyms,
      };
      // Configure synonyms for software, articles collections.
      // We upsert synonyms
      await client.collections('software').synonyms().upsert(item.id, synonymSchema);
      await client.collections('articles').synonyms().upsert(item.id, synonymSchema);
    }
    logger.info('Successfully configured synonyms for Typesense collections.');
  } catch (error) {
    logger.error('Failed to configure synonyms:', error);
    throw error;
  }
}
