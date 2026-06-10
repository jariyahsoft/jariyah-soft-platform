import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SoftwareEditLoader } from '@/components/software/SoftwareEditLoader';

interface EditSoftwarePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSoftwarePage({ params }: EditSoftwarePageProps) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <SoftwareEditLoader softwareId={id} />
    </DashboardLayout>
  );
}
