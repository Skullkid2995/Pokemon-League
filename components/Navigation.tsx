'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from './ThemeToggle';
import SideMenu from './layout/SideMenu';
import MatchMenu from './layout/MatchMenu';
import GameSelectorDropdown from './layout/GameSelectorDropdown';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavigationProps {
  initialUser?: any;
  initialUserData?: any;
  initialUserRole?: 'super_admin' | 'player' | null;
}

export default function Navigation({ 
  initialUser = null, 
  initialUserData = null, 
  initialUserRole = null 
}: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(initialUser);
  const [userData, setUserData] = useState<any>(initialUserData);
  const [userRole, setUserRole] = useState<'super_admin' | 'player' | null>(initialUserRole);
  const [loading, setLoading] = useState(false); // Already have initial data
  const [sideMenuOpen, setSideMenuOpen] = useState(true); // Abierto por defecto en desktop
  const [sideMenuCollapsed, setSideMenuCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(true);

  // Only fetch if we don't have initial data (for auth state changes)
  useEffect(() => {
    async function syncUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Only update if user state changed
      if (currentUser?.id !== user?.id) {
        setUser(currentUser);
        
        if (currentUser && !userData) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('id, role, nickname, name')
            .eq('auth_user_id', currentUser.id)
            .single();
          
          if (userProfile) {
            setUserData(userProfile);
            setUserRole(userProfile.role || null);
          }
        } else if (!currentUser) {
          setUserData(null);
          setUserRole(null);
        }
      }
    }
    
    // Check auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser();
    });

    return () => subscription.unsubscribe();
  }, [supabase, user?.id, userData]);

  // Scroll interaction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 10);
      
      // Hide/show navbar on scroll
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 tcg-gradient-primary shadow-lg border-b-4 border-yellow-400 dark:border-yellow-500 transition-transform duration-300",
          navVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Menu button */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSideMenuOpen(!sideMenuOpen)}
                className="text-white hover:bg-white/10 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <Link 
                href="/" 
                className="text-xl sm:text-2xl font-bold text-white hover:text-yellow-300 transition-colors flex items-center gap-2"
              >
                <svg 
                  className="w-6 h-6 sm:w-7 sm:h-7" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M5 16L3 5L8.5 12L12 5L15.5 12L21 5L19 16H5Z" 
                    fill="#FFCB05"
                    stroke="#FFB700"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="19" r="3" fill="#FFCB05" stroke="#FFB700" strokeWidth="1.5"/>
                </svg>
                <span>Gamer God</span>
              </Link>
            </div>

            {/* Center - Match and Game Selector */}
            <div className="flex items-center gap-3">
              <MatchMenu />
              <GameSelectorDropdown />
            </div>

            {/* Right side - Theme Toggle only */}
            {!loading && (
              <div className="flex items-center">
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Side Menu */}
      <SideMenu 
        isOpen={sideMenuOpen} 
        onClose={() => setSideMenuOpen(false)}
        userRole={userRole}
        user={user}
        userData={userData}
        onToggleCollapse={setSideMenuCollapsed}
        onLogout={async () => {
          await supabase.auth.signOut();
          router.push('/login');
          router.refresh();
        }}
      />

      {/* Spacer for fixed nav and sidebar on desktop */}
      <div className={cn("h-16 transition-all duration-300", sideMenuCollapsed ? "lg:ml-16" : "lg:ml-64")} />
    </>
  );
}
