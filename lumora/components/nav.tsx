'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Brain, BookOpen, MoreHorizontal } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/food', icon: Utensils, label: 'Food' },
  { href: '/therapist', icon: Brain, label: 'LUMI', featured: true },
  { href: '/journal', icon: BookOpen, label: 'Journal' },
  { href: '/reminders', icon: MoreHorizontal, label: 'More' },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(6, 9, 18, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          maxWidth: 520,
          margin: '0 auto',
          height: 64,
        }}
      >
        {navItems.map((item) => {
          const active = path === item.href;
          if (item.featured) {
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    marginTop: -16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: active
                        ? 'linear-gradient(135deg, #7C6AEA, #A78BFA)'
                        : 'linear-gradient(135deg, #1A1440, #241B5C)',
                      border: '1px solid rgba(124,106,234,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: active ? '0 6px 20px rgba(124,106,234,0.4)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Brain size={22} color={active ? '#fff' : '#7C6AEA'} />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: active ? '#7C6AEA' : '#4A5568',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '8px 12px',
                  borderRadius: 12,
                  transition: 'all 0.2s ease',
                }}
              >
                <item.icon
                  size={20}
                  color={active ? '#E8A020' : '#4A5568'}
                  style={{ transition: 'color 0.2s' }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#E8A020' : '#4A5568',
                    letterSpacing: '0.04em',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.label}
                </span>
                {active && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: '#E8A020',
                      marginTop: -4,
                    }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
