import { Client } from 'typesense';
import * as logger from 'firebase-functions/logger';

const TYPESENSE_HOST = process.env.TYPESENSE_HOST ?? 'localhost';
const TYPESENSE_PORT = parseInt(process.env.TYPESENSE_PORT ?? '8108', 10);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL ?? 'http';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY ?? 'test-admin-key';

let adminClient: Client | null = null;

export function getTypesenseAdminClient(): Client {
  if (!adminClient) {
    logger.info('Initializing Typesense Admin Client');
    adminClient = new Client({
      nodes: [
        {
          host: TYPESENSE_HOST,
          port: TYPESENSE_PORT,
          protocol: TYPESENSE_PROTOCOL as 'http' | 'https',
        },
      ],
      apiKey: TYPESENSE_ADMIN_API_KEY,
      connectionTimeoutSeconds: 5,
    });
  }
  return adminClient;
}
