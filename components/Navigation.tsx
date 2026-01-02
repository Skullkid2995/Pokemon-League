'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDisplayName } from '@/lib/utils/display';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'player' | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Get user role and profile data (nickname, name)
        const { data: userProfile } = await supabase
          .from('users')
          .select('id, role, nickname, name')
          .eq('auth_user_id', user.id)
          .single();
        
        if (userProfile) {
          setUserData(userProfile);
          setUserRole(userProfile.role || null);
        }
      }
      
      setLoading(false);
    }
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/users', label: 'Users' },
    { href: '/seasons', label: 'Seasons' },
    { href: '/rankings', label: 'Rankings' },
    { href: '/audit-logs', label: 'Audit Logs', adminOnly: true },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="tcg-gradient-primary shadow-lg border-b-4 border-yellow-400 dark:border-yellow-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-white hover:text-yellow-300 transition-colors flex items-center gap-2">
                <svg 
                  className="w-8 h-8 sm:w-10 sm:h-10" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                    fill="#FFCB05"
                    stroke="#FFB700"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>TCG Pocket League</span>
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => {
                // Hide admin-only items for non-admins
                if (item.adminOnly && userRole !== 'super_admin') {
                  return null;
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 pt-1 pb-1 border-b-2 text-sm font-medium transition-all rounded-t-lg ${
                      isActive(item.href)
                        ? 'border-yellow-400 text-white font-semibold bg-white/10'
                        : 'border-transparent text-white/90 hover:text-white hover:border-yellow-300 hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          {!loading && (
            <div className="hidden md:flex md:items-center gap-3">
              {user ? (
                <>
                  <ThemeToggle />
                  <div className="flex items-center gap-3 lg:gap-4">
                    <span className="text-xs lg:text-sm text-white/90 font-medium truncate max-w-[120px] lg:max-w-none">
                      {userData ? getDisplayName(userData) : user.email}
                    </span>
                    <Link
                      href="/change-password"
                      className="text-xs lg:text-sm text-white/80 hover:text-white transition-colors"
                    >
                      Change Password
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="bg-yellow-400 hover:bg-yellow-300 text-purple-700 px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-colors shadow-md hover:shadow-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <ThemeToggle />
                  <Link
                    href="/login"
                    className="bg-yellow-400 hover:bg-yellow-300 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-md hover:shadow-lg"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          )}
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-400"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 border-t-2 border-yellow-400 bg-purple-900/30">
            {navItems.map((item) => {
              // Hide admin-only items for non-admins
              if (item.adminOnly && userRole !== 'super_admin') {
                return null;
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-yellow-400/20 border-yellow-400 text-white font-semibold'
                      : 'border-transparent text-white/90 hover:bg-white/10 hover:border-yellow-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {!loading && user && (
              <>
                <div className="flex items-center justify-between px-3 py-2 border-t-2 border-yellow-400/30 my-1">
                  <div className="text-xs font-semibold text-white/90">
                    {userData ? getDisplayName(userData) : user.email}
                  </div>
                  <ThemeToggle />
                </div>
                <Link
                  href="/change-password"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-yellow-300 hover:text-white transition-colors"
                >
                  Change Password
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-yellow-300 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
            {!loading && !user && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium border-transparent text-white/90 hover:bg-white/10 hover:border-yellow-300 hover:text-white transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

