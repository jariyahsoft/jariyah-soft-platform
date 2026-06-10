import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SoftwareSubmissionForm } from '@/components/software/SoftwareSubmissionForm';

export default function NewSoftwarePage() {
  return (
    <DashboardLayout>
      <SoftwareSubmissionForm />
    </DashboardLayout>
  );
}
