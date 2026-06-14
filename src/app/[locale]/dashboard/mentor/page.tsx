import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MentorProfileForm } from '@/components/mentors/MentorProfileForm';

interface MentorDashboardPageProps {
  params: Promise<{
    locale: 'th' | 'en';
  }>;
}

export default async function MentorDashboardPage({ params }: MentorDashboardPageProps) {
  const { locale } = await params;

  const sessionCookie = (await cookies()).get('session')?.value;
  let initialProfile = null;

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie);
      const doc = await adminDb.collection('mentor_profiles').doc(decoded.uid).get();
      if (doc.exists) {
        const d = doc.data();
        initialProfile = {
          expertise: d?.expertise || [],
          bio: d?.bio || '',
          availability: d?.availability || 'available',
          maxProjects: d?.maxProjects || 3,
        };
      }
    } catch (e) {
      // Ignored
    }
  }

  return (
    <DashboardLayout>
      <MentorProfileForm initialProfile={initialProfile} locale={locale} />
    </DashboardLayout>
  );
}
