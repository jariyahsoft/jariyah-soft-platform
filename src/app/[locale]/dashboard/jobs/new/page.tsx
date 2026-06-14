import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { JobSubmissionForm } from '@/components/jobs/JobSubmissionForm';

export default function NewJobPage() {
  return (
    <DashboardLayout>
      <JobSubmissionForm />
    </DashboardLayout>
  );
}
