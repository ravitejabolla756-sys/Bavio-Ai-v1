'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { applicationNavigation } from '@/config/application-navigation';

export default function ApplicationNavigation({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Application" className="space-y-1 p-2">
    {applicationNavigation.map(section => <div key={section.group}>
      {section.group && <div className="px-3 py-0.5 text-xs font-mono text-ink-secondary uppercase">{section.group}</div>}
      {section.items.map(item => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + '/') || (item.href === '/dashboard/calls' && pathname.startsWith(item.href + '/'));
        return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
          className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? 'bg-surface-raised text-ink font-semibold' : 'text-ink-secondary hover:bg-surface-raised'}`}>
          <Icon aria-hidden className="h-4 w-4 shrink-0" /><span>{item.name}</span>
        </Link>;
      })}
    </div>)}
  </nav>;
}
