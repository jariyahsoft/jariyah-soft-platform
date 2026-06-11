import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArticleSubmissionForm } from '@/components/knowledge/ArticleSubmissionForm';

export default function NewArticlePage() {
  return (
    <DashboardLayout>
      <ArticleSubmissionForm />
    </DashboardLayout>
  );
}