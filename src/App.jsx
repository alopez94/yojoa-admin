import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import AdminDashboard from './pages/admin/AdminDashboard';
import EstablishmentDashboard from './pages/establishment/EstablishmentDashboard';
import store from './store'
import { Provider } from 'react-redux';

const LoadingScreen = () => {
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-gray-400 text-sm">Cargando...</div>
  </div>
}

const BlockedScreen = ({ icon, title, message }) => (
  <div className="min-h-screen flex items-center justify-center text-center p-8">
    <div className="max-w-md">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  </div>
);

const AdminRoute = ({ children }) => {
  const { user, isLoading, isAdmin } = useAuth();
  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/login" replace />
  return children;
}

const EstablishmentRoute = ({ children }) => {
  const { user, isLoading, accessError } = useAuth();

  if(isLoading) return <LoadingScreen />
  if(!user) return <Navigate to="/login"/>

  if (accessError === 'not_establishment') return (

    <BlockedScreen icon="🚫" title="Acceso Denegado" message="Este portal es unicamente para establecimientos, utiliza la app" />

  );

  if (accessError === 'pending_approval') return (

    <BlockedScreen icon="⏳" title="Solicitud en revisión" message="Tu establecimiento esta en revision, te notificaremos por correo cuando sea aprobado/rechazado." />
  );

  if (accessError === 'rejected') return (

    <BlockedScreen icon="❌" title="Solicitud Rechazada" message="Tu solicitud ha sido rechazada, puedes comunicarte a info@yojoatravel.com" />

  );

  if (accessError === 'deactivated') return (

    <BlockedScreen icon="🔒" title="Tu cuenta ha sido bloqueada" message="Contactanos a info@yojoatravel.com para mas informacion." />

  );

  return children;
}

const AppRoutes = () => {
  const { user, isLoading, isAdmin, userData, accessError} = useAuth();

  if (isLoading) return <LoadingScreen />

  //redirect to Login

 const home = !user ? '/login' : isAdmin ? '/admin' : '/dashboard';

  return (
    <Routes>

      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={home} replace />} />
      <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to={home} replace />} />
        {/* admin route */}
      <Route path="/admin/*" element={<AdminRoute> <AdminDashboard /> </AdminRoute>}/>
        {/* establishment route */}
      <Route path="/dashboard/*" element={ <EstablishmentRoute> <EstablishmentDashboard /> </EstablishmentRoute>} />

      
      <Route path="*" element={<Navigate to={home} replace />} />

    </Routes>
  )

}

export default function App() {

  return (
    <Provider store={store}>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
    </Provider>
  )
}