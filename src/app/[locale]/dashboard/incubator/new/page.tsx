import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectSubmissionForm } from '@/components/incubator/ProjectSubmissionForm';

export default function NewIncubatorProjectPage() {
  return (
    <DashboardLayout>
      <ProjectSubmissionForm />
    </DashboardLayout>
  );
}
