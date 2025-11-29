'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  user: User | null;
}

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '팀', href: '/teams', icon: Users },
  { name: '프로젝트', href: '/projects', icon: FolderKanban },
  { name: '설정', href: '/settings', icon: Settings },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">JL</span>
          </div>
          <span className="font-semibold text-lg">Jira Lite</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <Link href="/teams/new">
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            새 팀 만들기
          </Button>
        </Link>
      </div>

      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
