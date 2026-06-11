import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DeveloperArticleDashboard } from '@/components/knowledge/DeveloperArticleDashboard';

export default function DashboardArticlesPage() {
  return (
    <DashboardLayout>
      <DeveloperArticleDashboard />
    </DashboardLayout>
  );
}