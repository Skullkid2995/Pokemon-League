'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Users, Calendar, Trophy, FileText, X, ChevronLeft, ChevronRight, Settings, LogOut, UserPlus, Layers, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { getDisplayName } from '@/lib/utils/display';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'super_admin' | 'player' | null;
  user?: any;
  userData?: any;
  onToggleCollapse?: (collapsed: boolean) => void;
  onLogout?: () => void;
}

export default function SideMenu({ 
  isOpen, 
  onClose, 
  userRole, 
  user,
  userData,
  onToggleCollapse,
  onLogout 
}: SideMenuProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sideMenuCollapsed', newState.toString());
    onToggleCollapse?.(newState);
  };

  useEffect(() => {
    // En desktop, cargar estado guardado
    const savedState = localStorage.getItem('sideMenuCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
      onToggleCollapse?.(savedState === 'true');
    }
  }, [onToggleCollapse]);

  // Close menu when clicking outside (both mobile and desktop) and collapse if expanded
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking inside the menu
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking on the menu toggle button in navbar
      const navButton = target.closest('nav button, button[aria-label*="menu" i], button[aria-label*="Menu" i]');
      if (navButton) {
        return;
      }
      
      // On mobile: close menu if open
      if (isOpen) {
        onClose();
      }
      
      // On desktop: collapse menu if expanded (but don't hide it completely)
      if (!isCollapsed && window.innerWidth >= 1024) {
        const newState = true; // Collapsed
        setIsCollapsed(newState);
        localStorage.setItem('sideMenuCollapsed', newState.toString());
        onToggleCollapse?.(newState);
      }
    };

    // Small delay to avoid immediate closure when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isCollapsed, onClose, onToggleCollapse]);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/cards', label: 'Decks', icon: Layers },
    { href: '/friends', label: 'Friends', icon: UserPlus },
    { href: '/seasons', label: 'Stadium', icon: Building2 },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Overlay - solo en mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Side Menu - siempre visible en desktop, overlay en mobile */}
      <aside
        ref={menuRef}
        className={cn(
          "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-card border-r border-border z-40 transform transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!isCollapsed && <h2 className="text-lg font-bold">Menu</h2>}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="hidden lg:flex h-8 w-8"
                title={isCollapsed ? "Expand menu" : "Collapse menu"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-muted text-foreground",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          {user && (
            <div className="border-t border-border p-4 space-y-2">
              {!isCollapsed && (
                <div className="px-4 py-2 text-sm text-muted-foreground truncate">
                  {userData ? getDisplayName(userData) : user.email}
                </div>
              )}
              <Link
                href="/settings"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted text-foreground",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? "Settings" : undefined}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>Settings</span>}
              </Link>
              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-muted text-foreground",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? "Sign Out" : undefined}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Sign Out</span>}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
