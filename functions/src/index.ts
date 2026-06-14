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

// Export all Notification functions
export * as notifications from './notifications';

// Export all Social functions
export * as social from './social';

// Export all Reputation & Trending functions
export * as reputation from './reputation';

// Export all Learning functions
export * as learning from './learning';

// Export all Event functions
export * as events from './events';

// Export all Job functions
export * as jobs from './jobs';

