import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from "../../config/firebase";
import { signOut } from "firebase/auth";

const TABS = ['pending', 'approved', 'rejected'];

const STATUS_LABELS = {
    pending_approval: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
    deactivated: { label: 'Desactivado', color: 'bg-gray-100 text-gray-600' },
};



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
            console.log('Error fetching establishments: ', error );
        }
        finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchEstablishments(activeTab)
    }, [activeTab])

    const handleAction = async (estId, newStatus) => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'establishments', estId), {

                status: newStatus,
                ApprovedAt: newStatus === 'approved' ? serverTimestamp() : null,
                updatedAt: serverTimestamp(),
                adminFeedback: feedback || null,
            });

            setFeedback('');
            setSelected(null);
            fetchEstablishments(activeTab);

        }
        catch (error) {
            console.log('Error changing establishment status: ', error);
        }
        finally {
            setActionLoading(false);
        }
    }

    const handleSignOut = () => signOut(auth);

    const tabCount = (tab) => {
        if (activeTab === tab) return establishments.length;
        return null;
    }


    return (
        <div className="min-h-screen bg-gray-50 p-8">
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

            <div className="flex-1 min-w-0">

                <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                    {TABS.map(tab => (

                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={
                                `px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}>
                                    {tab === 'pending' ? 'Pendientes' : tab === 'approved' ? 'Aprobados' : 'Rechazados'}
                                    {activeTab === tab && establishments.length > 0 && (
                                        <span className="ml-2 bg-gray text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                                            {establishments.length}
                                        </span>
                                    )}

                        </button>
                    ))}

                </div>

                {/* the list */}
                {isLoading ? ( 
                    <div className="text-sm text-gray-400 py-12 text-center" >Cargando...</div>
                ) : establishments.length === 0 ? (
                    <div className="text-sm text-gray-400 py-12 text-center" >No hay establecimientos en esta categoria</div>
                ): (
                    <div className="space-y-3">
                        {establishments.map(est => (
                            <div
                                key={est.id}
                                onClick={() => {setSelected(est), setFeedback(''); }}
                                className={`bg-white border-rounded-xl p-4 cursor-pointer transition-all ${
                                   selected?.id === est.id 
                                   ? 'border-blue-500 ring-2 ring-blue-100'
                                   : 'border-gray-200 hover:border-gray-300'
                                }`}>

                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{est.name}</p>
                                        <p className="text-sm text-gray-500 truncate mt-0.5">{est.address}</p>
                                        <p className="text-xs text-gray-400 mt-1">{est.category}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_LABELS[est.status]?.color}`}>
                                            {STATUS_LABELS[est.status]?.label}
                                        </span>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

                {/* right panel */}
                <div className="w-80 shrink-0">
                    {
                        selected ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900"> {selected.name} </h2>
                                    <button className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                                    onClick={() => setSelected(null)}
                                    >x</button>
                                </div>

                                {/* details */}
                                <div className="space-y-3 text-sm mb-5">
                                    <DetailRow label="Categoria" value={selected.category} />
                                    <DetailRow label="Direccion" value={selected.address} />
                                    <DetailRow label="Email" value={selected.email} />
                                    <DetailRow label="Telefono" value={selected.phone} />
                                    <DetailRow label="Descripcion" value={selected.description} />
                                    {selected.website && <DetailRow label="Website" value={selected.website}/>}
                                    <DetailRow label="Estado Actual" value={STATUS_LABELS[selected.status]?.label}/>
                                    {selected.adminFeedback && (
                                        <DetailRow label="Feedback Anterior" value={selected.adminFeedback}/>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Mensaje al establecimiento (opcional)
                                    </label>
                                    <textarea 
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    rows={3}
                                    placeholder="Pendiente informacion de..."
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>

                                {/* actions = cambiar el status del establecimiento */}
                                <div className="flex flex-col gap-2">
                                    {selected.status !== 'approved' && (
                                        <button
                                        onClick={() => handleAction(selected.id,'approved')}
                                        disabled={actionLoading}
                                        className="w-full bg-green-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-700 disable:opacity-50 transition-colors"
                                        >
                                            {actionLoading ? 'Procesando' : 'Aprobar Establecimiento'}
                                        </button>
                                    )}

                                    {selected.status !== 'rejected' && (
                                        <button
                                        onClick={() => handleAction(selected.id,'rejected')}
                                        disabled={actionLoading}
                                        className="w-full bg-red-50 text-red-700 text-sm font-medium py-2 rounded-lg hover:bg-red-100 disable:opacity-50 transition-colors border-red-200"
                                        >
                                            {actionLoading ? 'Procesando' : 'Rechazar'}
                                        </button>
                                    )}

                                     {selected.status !== 'approved' && (
                                        <button
                                        onClick={() => handleAction(selected.id,'deactivated')}
                                        disabled={actionLoading}
                                        className="w-full bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 disable:opacity-50 transition-colors"
                                        >
                                            {actionLoading ? 'Procesando' : 'Desactivar'}
                                        </button>
                                    )}


                                </div>
                                
                            </div>
                        ) 
                        : (
                            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                                <p className="text-sm text-gray-400">
                                    Selecciona un estavlecimiento para ver los detalles y tomar accion.
                                </p>
                                
                            </div>
                        )
                    }

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
