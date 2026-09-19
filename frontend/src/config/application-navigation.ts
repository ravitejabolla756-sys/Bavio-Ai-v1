import { Layout, PhoneCall, IdentificationCard, Users, BookOpen, GitFork, ChartBar, CreditCard, Gear, Lightning } from '@phosphor-icons/react';

/** Only implemented destinations. Both application shells consume this registry. */
export const applicationNavigation = [
  { group: '', items: [{ name: 'Overview', href: '/workspace', icon: Layout }] },
  { group: 'Operate', items: [
    { name: 'Conversations', href: '/dashboard/calls', icon: PhoneCall },
    { name: 'Leads', href: '/dashboard/leads', icon: IdentificationCard },
  ] },
  { group: 'Build', items: [
    { name: 'Agents', href: '/dashboard/assistant', icon: Users },
    { name: 'Knowledge', href: '/dashboard/knowledge', icon: BookOpen },
    { name: 'Actions', href: '/dashboard/actions', icon: Lightning },
    { name: 'Workflows', href: '/dashboard/workflows', icon: GitFork },
  ] },
  { group: 'Connect', items: [
    { name: 'Phone Numbers', href: '/dashboard/phone-numbers', icon: GitFork },
  ] },
  { group: 'Improve', items: [{ name: 'Analytics', href: '/dashboard/analytics', icon: ChartBar }] },
  { group: 'Account', items: [
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Gear },
  ] },
] as const;
export const applicationNavigationItems = applicationNavigation.flatMap(section => [...section.items]);
