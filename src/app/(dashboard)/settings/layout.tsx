import Link from 'next/link';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-6">
      <aside className="w-48 shrink-0">
        <nav className="space-y-1">
          <Link
            href="/settings/profile"
            className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100"
          >
            프로필
          </Link>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
