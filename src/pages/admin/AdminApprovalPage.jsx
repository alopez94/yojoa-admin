
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchEstablishments,
    setSearchQuery,
    setSelectedCategory,
    setSelectedStatus,
    cleanFilters,
    selectFilteredEstablishments,
    selectEstablishmentStatus,
    selectSelectedCategory,
    selectLastFetch,
    selectSearchQuery,
} from '../../store/establishmentSlice'
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from "../../config/firebase";

const CACHE_DURATION = 5 * 60 * 1000;
const TABS = ['pending_approval', 'approved', 'rejected','disabled'];
const STATUS_LABELS = {
    pending_approval: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
    disabled: { label: 'Desactivado', color: 'bg-gray-100 text-gray-600' },
};

export default function AdminApprovalPage() {

    const dispatch = useDispatch();
    const { userData } = useAuth();

    const filteredEstablishments = useSelector(selectFilteredEstablishments);
    const status = useSelector(selectEstablishmentStatus);
    const searchQuery = useSelector(selectSearchQuery);
    const selectCategory = useSelector(selectSelectedCategory);
    const lastFetch = useSelector(selectLastFetch);


    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Pending');
    const [selected, setSelected] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const isLoading = status === 'loading';

    useEffect(() => {
        const isStale = !lastFetch || Date.now() - lastFetch > CACHE_DURATION;
        if (isStale) {
            dispatch(fetchEstablishments());
        }
    }, [])

    const tabCount = (tab) => {
        if (activeTab === tab) return filteredEstablishments.length;
        return null;
    }

    useEffect(() => {
        filtereEstablishmentByStatus();
        

    }, [activeTab])

    const filtereEstablishmentByStatus = () => {
        
        
        try {
            if (activeTab) {
                dispatch(setSelectedStatus(activeTab));
                setSelected(null);
                 
            }
        }
        catch (error) {
            console.log(error)
        }

    }

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
                dispatch(fetchEstablishments());
    
            }
            catch (error) {
                console.log('Error changing establishment status: ', error);
            }
            finally {
                setActionLoading(false);
            }
        }

    return (
        <div className='p-8 m-w-5x1 flex gap-1 row'>
            <div >

                <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                    {TABS.map(tab => (

                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={
                                `px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}>
                                   
                            {tab === 'pending_approval' ? 'Pendientes' : tab === 'approved' ? 'Aprobados' : tab ==='rejected' ?  'Rechazados' : tab === 'disabled' ? 'Deshabilitados' : 'Other'}
                            {activeTab === tab && filteredEstablishments.length > 0 && (
                                <span className="ml-2 bg-gray text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                                    {filteredEstablishments.length}
                                </span>
                            )}

                        </button>
                    ))}

                </div>

                {/* the list */}
                {isLoading ? (
                    <div className="text-sm text-gray-400 py-12 text-center" >Cargando...</div>
                ) : filteredEstablishments.length === 0 ? (
                    <div className="text-sm text-gray-400 py-12 text-center" >No hay establecimientos en esta categoria</div>
                ) : (
                    <div className="space-y-3">
                        {filteredEstablishments.map(est => (
                            <div
                                key={est.id}
                                onClick={() => { setSelected(est), setFeedback('') }}
                                className={`bg-white border-rounded-xl p-4 cursor-pointer transition-all ${selected?.id === est.id
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
                {selected ? (
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
                            {selected.website && <DetailRow label="Website" value={selected.website} />}
                            <DetailRow label="Estado Actual" value={STATUS_LABELS[selected.status]?.label} />
                            {selected.adminFeedback && (
                                <DetailRow label="Feedback Anterior" value={selected.adminFeedback} />
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
                            {selected.status === 'pending_approval' && (
                                <button
                                    onClick={() => handleAction(selected.id, 'approved')}
                                    disabled={actionLoading}
                                    className="w-full bg-green-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-700 disable:opacity-50 transition-colors"
                                >
                                    {actionLoading ? 'Procesando' : 'Aprobar Establecimiento'}
                                </button>
                            )}

                            {selected.status === 'rejected' && (
                                <button
                                    onClick={() => handleAction(selected.id, 'approved')}
                                    disabled={actionLoading}
                                    className="w-full bg-green-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-700 disable:opacity-50 transition-colors"
                                >
                                    {actionLoading ? 'Procesando' : 'Reactivar Establecimiento'}
                                </button>
                            )}

                            {selected.status === 'disabled' && (
                                <button
                                    onClick={() => handleAction(selected.id, 'approved')}
                                    disabled={actionLoading}
                                    className="w-full bg-green-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-green-700 disable:opacity-50 transition-colors"
                                >
                                    {actionLoading ? 'Procesando' : 'Reactivar Establecimiento'}
                                </button>
                            )}

                            {selected.status === 'pending_approval' && (
                                <button
                                    onClick={() => handleAction(selected.id, 'rejected')}
                                    disabled={actionLoading}
                                    className="w-full bg-red-50 text-red-700 text-sm font-medium py-2 rounded-lg hover:bg-red-100 disable:opacity-50 transition-colors border-red-200"
                                >
                                    {actionLoading ? 'Procesando' : 'Rechazar'}
                                </button>
                            )}

                            {selected.status === 'approved' && (
                                <button
                                    onClick={() => handleAction(selected.id, 'disabled')}
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
                                Selecciona un establecimiento para ver los detalles y tomar accion.
                            </p>

                        </div>
                    )
                }

            </div>

        </div>

    )
}

function DetailRow({ label, value }) {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-gray-700 leading-snug">{value}</p>
        </div>
    );
}
