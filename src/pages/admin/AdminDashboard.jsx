import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import AdminApprovalPage from "./AdminApprovalPage";
import AdminBookingsPage from "./AdminBookingsPage";
import AdminEstablishmentsPage from "./AdminEstablishmentsPage";


const NAV_ITEMS = [
    { to: '/admin/adminEstablishments', label: 'Administrar Establecimientos', icon: '⛯' },
    { to: '/admin/reservations', label: 'Reservaciones', icon: '📅' },
    { to: '/admin/establishments', label: 'Listado de establecimientos', icon: '📍' },
    
]


export default function AdminDashboard() {

    const { userData } = useAuth();
    const [activeTab, setActiveTab] = useState('Pending');
    const [establishments, setEstablishments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    const fetchEstablishments = async (status) => {
        setIsLoading(true);
        setSelected(null);

        try {
            const firestoreStatus = status === 'pending' ? 'pending_approval' : status;

            const q = query(
                collection(db, 'establishments'),
                where('status', '==', firestoreStatus),
                orderBy('createdAt', 'desc')

            );
            const snap = await getDocs(q);
            setEstablishments(snap.docs.map(d => ({ id: d.id, ...d.data() })));

        }
        catch (error) {
            console.log('Error fetching establishments: ', error);
        }
        finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchEstablishments(activeTab)
    }, [activeTab])

    

    const handleSignOut = () => signOut(auth);

    const tabCount = (tab) => {
        if (activeTab === tab) return establishments.length;
        return null;
    }


    return (
        <div>
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Yojoa Travel Admin</h1>
                    <p className="text-gray-500 mt-1">Bienvenido, super admin.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{userData?.email}</span>
                    <button
                        className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        onClick={handleSignOut}
                    >
                        Cerrar Sesion
                    </button>

                </div>
            </header>

            {/* left panel */}
            <div className="min-h-screen bg-gray-50 flex">

                <aside className='w-60 bg-white border-r border-gray-200 flex flex-col shrink-0'>
                    <div className='px-5 py-5 border-b border-gray-100'>

                        <p>Panel de Administracion</p>
                    </div>

                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {NAV_ITEMS.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-l text-s, transition-colors ${isActive
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

                </aside>

                <main className="flex-1 overflow-y-auto">

                    <Routes>
                        <Route index element={<Navigate to="/admin/adminEstablishments" replace />} />
                        <Route path="adminEstablishments" element={<AdminApprovalPage />} />
                        <Route path="reservations" element={<AdminBookingsPage />} />
                        <Route path="establishments" element={<AdminEstablishmentsPage />} />
                       
                    </Routes>
                </main>
              
            </div>

        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-gray-700 leading-snug">{value}</p>
        </div>
    );
}
