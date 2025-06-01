import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, User, Calendar, Book, Users, QrCode, ClipboardList, Menu, X, Scan
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const navLinks = (() => {
    switch (user.role) {
      case 'student':
        return [
          { to: '/student', icon: <Home size={20} />, label: 'Dashboard' },
          { to: '/student/profile', icon: <User size={20} />, label: 'Profile' },
          { to: '/student/mess-plan', icon: <Calendar size={20} />, label: 'Mess Plan' },
          { to: '/student/attendance', icon: <ClipboardList size={20} />, label: 'Attendance' },
        ];
      case 'staff':
        return [
          { to: '/staff', icon: <Home size={20} />, label: 'Dashboard' },
          { to: '/staff/scanner', icon: <Scan size={20} />, label: 'QR Scanner' },
          { to: '/staff/attendance', icon: <ClipboardList size={20} />, label: 'Attendance' },
        ];
      case 'admin':
        return [
          { to: '/admin', icon: <Home size={20} />, label: 'Dashboard' },
          { to: '/admin/users', icon: <Users size={20} />, label: 'Manage Users' },
          { to: '/admin/mess-plans', icon: <Book size={20} />, label: 'Mess Plans' },
          { to: '/admin/attendance', icon: <ClipboardList size={20} />, label: 'Attendance Records' },
        ];
      default:
        return [];
    }
  })();

  return (
    <>
      <div className="lg:hidden p-4">
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
          <Menu size={24} />
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 bg-blue-600 text-white w-72 flex flex-col z-20 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          <h2 className="text-2xl font-bold">Mess Management</h2>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-white">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <nav className="p-4 space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-md transition-colors
                  ${isActive
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500'}
                `}
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                <span className="ml-4">{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.name?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-blue-200 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="hidden lg:block w-72"></div>
    </>
  );
};

export default Sidebar;