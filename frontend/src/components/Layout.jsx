import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Calendar, Database, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'Заказы', href: '/orders', icon: Package },
    { name: 'Календарь', href: '/calendar', icon: Calendar },
    { name: 'Материалы', href: '/materials', icon: Database },
    { name: 'Настройки', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-[250px] bg-[#7A7A79] text-white flex flex-col fixed h-full">
        <div className="py-6 px-4 border-b border-gray-600 flex items-center justify-center">
          <img src="/logo.png" alt="Factory Hub" className="w-[85%] h-auto" />
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-[#384E84] text-white shadow-md'
                    : 'text-gray-200 hover:text-white hover:bg-gray-700'
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-600">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#384E84] flex items-center justify-center text-xs font-bold">
              ВП
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Владелец</p>
              <p className="text-xs text-gray-300 truncate">Производство</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[250px] overflow-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;