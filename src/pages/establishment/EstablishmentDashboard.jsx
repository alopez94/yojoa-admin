import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import ProfilePage from './ProfilePage';
import ActivitiesPage from './ActivitiesPage';
import BookingsPage from './BookingsPage';
import PhotosPage from './PhotosPage';

const NAV_ITEMS = [
  { to: '/dashboard/profile', label: 'Mi Perfil', icon: '🏢' },
  { to: '/dashboard/activities', label: 'Actividades', icon: '🎯' },
  { to: '/dashboard/bookings', label: 'Reservaciones', icon: '📅' },
  { to: '/dashboard/photos', label: 'Fotos', icon: '📷' },
]

export default function EstablishmentDashboard() {

  const { userData, establishmentData } = useAuth();

  const handleSignout = () => signOut(auth);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* sidebar */}
      <aside className='w-60 bg-white border-r border-gray-200 flex flex-col shrink-0'>

        <div className='px-5 py-5 border-b border-gray-100'>
          <p className='font-semibold text-gray-900 text-sm'>Yojoa Travel</p>
          <p>{establishmentData?.name || "Mi Establecimiento"}</p>
        </div>
        {establishmentData?.status === 'approved' && (
          <div className="mx-4 mt-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 font-medium">✓ Establecimiento aprobado</p>
          </div>
        )}

        {/* Navigation sidebar */}
        <nav className='flex-1 px-3 py-4 space-y-1'>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate mb-2">{userData?.email}</p>
          <button
            onClick={handleSignout}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>


      </aside>

      <main className="flex-1 overflow-y-auto">

        <Routes>
          <Route index element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="photos" element={<PhotosPage />} />
        </Routes>

      </main>

    </div>
  );
}