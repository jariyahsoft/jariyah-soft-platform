import { Award, Download, Globe, Laptop, Monitor, ShieldCheck, Smartphone, Star } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { PLATFORM_LABELS, SoftwareItem } from '@/lib/software/types';

interface SoftwareCardProps {
  software: SoftwareItem;
}

const platformIcons: Record<string, React.ReactNode> = {
  windows: <Monitor className="h-4 w-4" />,
  mac: <Laptop className="h-4 w-4" />,
  web: <Globe className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  linux: <Monitor className="h-4 w-4" />,
};

/** Certification badge display config */
const CERT_CONFIG: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  verified: {
    icon: <ShieldCheck className="h-3 w-3" />,
    label: 'Verified',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  security_checked: {
    icon: <ShieldCheck className="h-3 w-3" />,
    label: 'Security Checked',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  editors_choice: {
    icon: <Award className="h-3 w-3" />,
    label: "Editor's Choice",
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  open_source_verified: {
    icon: <Globe className="h-3 w-3" />,
    label: 'Open Source',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  community_recommended: {
    icon: <Star className="h-3 w-3" />,
    label: 'Community Pick',
    className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  },
};

function formatCount(value: number) {
  return Intl.NumberFormat('en', { notation: 'compact' }).format(value);
}

export function SoftwareCard({ software }: SoftwareCardProps) {
  return (
    <Link href={`/software/${software.slug}`} className="group block h-full">
      <Card hoverEffect className="h-full overflow-hidden">
        <CardContent className="flex h-full flex-col gap-5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/20 to-bg-secondary text-xl font-black text-accent">
              {software.logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={software.logoPath} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                software.name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-bold text-text-primary group-hover:text-accent">
                  {software.name}
                </h3>
                <Badge variant="info">{software.categoryName}</Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary">by {software.developerName}</p>
            </div>
          </div>

          {/* Certification Badges */}
          {software.certifications && software.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {software.certifications.map((cert) => {
                const config = CERT_CONFIG[cert];
                if (!config) return null;
                return (
                  <span
                    key={cert}
                    title={config.label}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.className}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                );
              })}
            </div>
          )}

          <p className="line-clamp-3 flex-1 text-sm leading-6 text-text-secondary">
            {software.shortDescription}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-text-secondary/10 pt-4 text-sm text-text-secondary">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-text-primary">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {software.ratingAverage.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Download className="h-4 w-4" />
                {formatCount(software.downloadCount)}
              </span>
            </div>
            <div className="flex items-center gap-1.5" aria-label="Supported platforms">
              {software.platforms.slice(0, 4).map((platform) => (
                <span
                  key={platform}
                  title={PLATFORM_LABELS[platform] ?? platform}
                  className="rounded-full bg-bg-secondary p-1.5 text-text-secondary"
                >
                  {platformIcons[platform] ?? <Globe className="h-4 w-4" />}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
