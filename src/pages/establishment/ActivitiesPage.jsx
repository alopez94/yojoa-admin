import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
    'Food & Dining',
    'Recreation & Adventure',
    'Lodging & Accommodation',
    'Nature & Outdoor',
    'Cultural & Historical',
    'Transportation',
];

const EMPTY_FORM = {
    name: '',
    description: '',
    category: '',
    price: '',
    currency: 'HNL',
    duration: '',
    maxCapacity: '',
    maxCapacityPerInterval: '',
    image: '',
};


export default function ActivitiesPage() {

    const { establishmentData } = useAuth();
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingActivity, setEditingActivity] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [error, setError] = useState(null);

    const fetchActivities = async () => {
        if (!establishmentData?.id) return;
        setIsLoading(true);
        try {

            const q = query(
                collection(db, 'activities'),
                where('establishmentId', '==', establishmentData.id)
            );
            const snap = await getDocs(q);
            setActivities(snap.docs.map(d => ({ id: d.id, ...d.data()})));
        }
        catch (error) {
            console.log("Error Fetching activities: ", error.code, error.message);
        }
        finally {
            setIsLoading(false);
        }        
    }

    useEffect(() => {
        fetchActivities();
    }, [establishmentData?.id]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const openCreate = () => {
        setEditingActivity(null);
        setForm(EMPTY_FORM);
        setError(null);
        setShowForm(true);
    }

    const openEdit = (activity) => {
        setEditingActivity(activity);
        setForm({
            name: activity.name,
            description: activity.description,
            category: activity.category,
            price: activity.price,
            currency: activity.currency || 'HNL',
            duration: activity.duration,
            maxCapacityPerInterval: activity.maxCApacityPerInterval,
            maxCapacity: activity.maxCapacity,
            image: activity.image || '',
        })
        setError(null);
        setShowForm(true);
    }

    const validateForm = () => {
        if (!form.name.trim()) return 'El nombre es requerido';
        if (!form.description.trim()) return 'La descripción es requerida';
        if (!form.category) return 'La categoría es requerida';
        if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
            return 'El precio debe ser un número mayor a 0';
        if (!form.duration || isNaN(form.duration) || Number(form.duration) <= 0)
            return 'La duración debe ser un número mayor a 0';
        if (!form.maxCapacity || isNaN(form.maxCapacity) || Number(form.maxCapacity) <= 0)
            return 'La capacidad debe ser un número mayor a 0';
        return null;
    };

    const handleSave = async () => {

        if (!establishmentData?.id) {
            setError('No se pudo identificar tu establecimiento. Recarga la página.');
            setIsSaving(false);
            return;
        }
        const validationError = validateForm();
        if (validationError) {
            setError(validationError); return;
        }

        setIsSaving(true);
        setError(null);

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            category: form.category,
            price: parseFloat(form.price),
            currency: form.currency,
            duration: parseInt(form.duration),
            maxCapacity: parseInt(form.maxCapacity),
            image: form.image.trim(),
            establishmentId: establishmentData.id,
            maxCapacityPerInterval: parseInt(form.maxCapacityPerInterval),
            updatedAt: serverTimestamp(),
        };

        try {
            if (editingActivity) {
                await updateDoc(doc(db, 'activities', editingActivity.id), payload);
            }
            else {
                console.log(payload);
                await addDoc(collection(db, 'activities'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
            }
            setShowForm(false);
            setEditingActivity(null);
            setForm(EMPTY_FORM);
            fetchActivities();
        }

        catch (error) {
            console.error("Error saving activity: ", error);
            setError('Error al guardar. Intenta de nuevo');
        }
        finally {
            setIsSaving(false);
        }

    }

    const handleDelete = async (activityId) => {

        try {
            await deleteDoc(doc(db, 'activities', activityId));
            setDeleteConfirm(null);
            fetchActivities();
        }
        catch (error) {
            console.error("error deleting activity:", error.code, error.message)
        }
    }

    const handleCancel = () => {
        setShowForm(false);
        setEditingActivity(null);
        setForm(EMPTY_FORM);
        setError(null);
    }

    return (
        <div className='p-8 m-w-5x1'>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Actividades</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Gestiona los servicios que ofrece tu establecimiento
                    </p>
                </div>
                {!showForm && (
                    <button onClick={openCreate}
                        className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        + Nueva actividad
                    </button>
                )}
            </div>

            {/* Form */}

            {showForm && (
                <div className='bg-white border border-gray-200 rounded-xl p-6 mb-6'>
                    <h2 className='font-semibold text-gray-900 mb-5'>
                        {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
                    </h2>

                    {error && (
                        <div className='bg-red-50 border-red-500 text-red-700 text-sm p-3 rounded mb-5'>
                            {error}
                        </div>
                    )}

                    <div className='grid grid-col-3 gap-4'>

                        <div className='col-span-3'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Nombre</label>
                            <input
                                name='name'
                                value={form.name}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='Ejemplo: Paseo en Lancha'
                            />
                        </div>

                        <div className='col-span-3'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Descripcion</label>
                            <textarea
                                name='description'
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                                placeholder='Describa la actividad'
                            />
                        </div>

                        <div className='col-span-3'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Categorias</label>
                            <select
                                name='category'
                                value={form.category}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            >
                                <option value="">Selecciona una...</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Duracion (minutos)</label>
                            <input
                                name='duration'
                                type='number'
                                value={form.duration}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                                placeholder='90'
                                min='1'
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Precio</label>
                            <input
                                name='price'
                                type='number'
                                value={form.price}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                                placeholder='150'
                                min='0.01'
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Moneda</label>
                            <select
                                name='currency'
                                value={form.currency}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                            >
                                <option value="HND">HNL - Lempira</option>
                                <option value="USD">USD - Dolar</option>
                            </select>
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Capacidad Por Ticket</label>
                            <input
                                name='maxCapacity'
                                type='number'
                                value={form.maxCapacity}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                                placeholder='20'
                                min='1'
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Capacidad Por Intervalo</label>
                            <input
                                name='maxCapacityPerInterval'
                                type='number'
                                value={form.maxCapacityPerInterval}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                                placeholder='20'
                                min='1'
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL de imagen <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <input name="image" value={form.image} onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://..." />
                        </div>
                    </div>

                    <div className='flex gap-3 mt-6'>
                        <button
                            onClick={handleSave}
                            className='bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                            disabled={isLoading}
                        >
                            {isSaving ? "Guardando" : editingActivity ? "Guardar cambios" : "Crear Actividad"}
                        </button>
                        <button onClick={handleCancel}
                            className="text-sm text-gray-500 px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            Cancelar
                        </button>

                    </div>

                </div>
            )}

            {/* Show existing activities */}
            {isLoading ? (
                <div className='text-sm text-gray-900 py-12 text-center'>Cargando Actividades...</div>
            ) : activities.length === 0 && !showForm ? (
                <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
                    <p className="text-gray-400 text-sm">No tienes actividades aún.</p>
                    <button onClick={openCreate}
                        className="mt-3 text-blue-600 text-sm font-medium hover:underline">
                        Crea tu primera actividad
                    </button>
                </div>
            ) : (

                <div className='space-y-3'>
                    {activities.map(activity => (
                        <div key={activity.id}
                            className='bg-white border border-gray-200 rounded-xl flex items-start justify-between gap-4'
                        >
                            <div className='flex gap-4 min-w-0'>
                                {activity.image ? (
                                    <img src={activity.image} alt={activity.name}
                                        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-2xl">
                                        🎯
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900">{activity.name}</p>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{activity.description}</p>
                                    <div className="flex flex-wrap gap-3 mt-2">
                                        <span className="text-xs text-gray-400">{activity.category}</span>
                                        <span className="text-xs font-medium text-gray-700">
                                            {activity.currency} {activity.price?.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-gray-400">{activity.duration} min</span>
                                        <span className="text-xs text-gray-400">Máx. {activity.maxCapacity} personas</span>
                                    </div>
                                </div>

                            </div>

                            {/* actions */}

                            <div className='flex gap-2 shrink-0'>
                                <button className='text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-50 transition-colors'
                                    onClick={() => openEdit(activity)}
                                >
                                    Editar
                                </button>
                                {deleteConfirm === activity.id ?
                                    (
                                        <div className='flex gap-1 items-center'>
                                            <span className='text-xs text-gray-500'>Confirmar?</span>
                                            <button
                                                onClick={() => handleDelete(activity.id)}
                                                className='text-xs text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50'>
                                                Si
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100">
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(activity.id)}
                                            className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                            Eliminar
                                        </button>
                                    )
                                }

                            </div>

                        </div>
                    ))}

                </div>
            )

            }

        </div>
    )
}