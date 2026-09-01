import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl tracking-tight text-foreground leading-[1.15]">
          {title}
        </h1>
        {description && (
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
