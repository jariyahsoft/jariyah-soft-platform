import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DeveloperSoftwareDashboard } from '@/components/software/DeveloperSoftwareDashboard';

export default function DashboardSoftwarePage() {
  return (
    <DashboardLayout>
      <DeveloperSoftwareDashboard />
    </DashboardLayout>
  );
}
