import * as admin from 'firebase-admin';

// Initialize Firebase Admin globally
admin.initializeApp();

// Export all Auth functions
export * from './auth/onUserCreate';
export * from './auth/setRole';

// Export all Search functions
export * as search from './search';

// Export all Moderation functions
export * as moderation from './moderation';
