import { Clock, FileText } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { ArticleItem } from '@/lib/articles/types';

interface ArticleCardProps {
  article: ArticleItem;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const readingTime = article.readingTimeMinutes ?? Math.ceil(article.body.length / 1000);

  return (
    <Link href={`/knowledge/${article.slug}`} className="group block h-full">
      <Card hoverEffect className="h-full overflow-hidden">
        {article.coverPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverPath}
            alt=""
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{article.categoryName}</Badge>
            <Badge variant="default" size="sm">
              {article.language === 'th' ? 'ไทย' : 'EN'}
            </Badge>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg font-bold text-text-primary group-hover:text-accent">
              {article.title}
            </h3>
            <p className="text-sm leading-6 text-text-secondary mt-2 line-clamp-2">
              {article.excerpt}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Avatar src={article.authorPhotoURL} name={article.authorName} size="sm" />
              <span className="font-medium text-text-primary">{article.authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}