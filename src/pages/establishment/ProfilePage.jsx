import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const DAYS = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miercoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sabado' },
    { key: 'sunday', label: 'Domingo' },
];

const CATEGORIES = [
    'Food & Dining',
    'Recreation & Adventure',
    'Lodging & Accommodation',
    'Nature & Outdoor',
    'Cultural & Historical',
    'Transportation',
];



export default function ProfilePage() {

    const { establishmentData } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        name: '',
        description: '',
        category: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        website: '',
        

    })

    const [hours, setHours] = useState(DAYS.reduce((acc, day) => ({
        ...acc,
        [day.key]: { open: '08:00', close: '17:00', closed: false }
    }), {})
    );

    useEffect(() => {
        if (!establishmentData) return;

        setForm({
            name: establishmentData.name || '',
            description: establishmentData.description || '',
            category: establishmentData.category || '',
            address: establishmentData.address || '',
            latitude: establishmentData.latitude || '',
            longitude: establishmentData.longitude || '',
            phone: establishmentData.phone || '',
            email: establishmentData.email || '',
            website: establishmentData.website || '',
            
        });

        if (establishmentData.businessHours) {
            setHours(establishmentData.businessHours);
        }

    }, [establishmentData])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleHoursChange = (day, field, value) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    }

    const handleClosedToggle = (day) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], closed: !prev[day].closed }
        }));
    }

    const validateForm = () => {
        if (!form.name.trim()) return 'El nombre es requerido';
        if (!form.description.trim()) return 'La descripción es requerida';
        if (!form.category) return 'La categoría es requerida';
        if (!form.address.trim()) return 'La dirección es requerida';
        if (!form.email.trim()) return 'El email es requerido';
        if (!form.phone.trim()) return 'El teléfono es requerido';
        if (form.latitude && isNaN(Number(form.latitude))) return 'Latitud inválida';
        if (form.longitude && isNaN(Number(form.longitude))) return 'Longitud inválida';
        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) { setError(validationError); return }

        setIsSaving(true);
        setError(null);
        setSuccess(false);
        console.log(form);
        try {
            await updateDoc(doc(db, 'establishments', establishmentData.id), {
                name: form.name.trim(),
                description: form.description.trim(),
                category: form.category,
                address: form.address.trim(),
                latitude: form.latitude ? Number(form.latitude) : null,
                longitude: form.longitude ? Number(form.longitude) : null,
                phone: form.phone.trim(),
                email: form.email.trim(),
                website: form.website.trim(),
                businessHours: hours,
                updatedAt: serverTimestamp(),  
                           
            })

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);

        }
        catch (error) {
            console.error("Error saving update, please try again: ", error);
            setError("Error al guardar. Intenta de nuevo");
        }

    }

    return (
        <div className='p-8 max-w-3x1'>

            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900">Mi perfil</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                    Información visible para los turistas en la app
                </p>
            </div>

            {error && (
                <div className='bg-red-50 border-1-4 border-red-500 text-red-700 text-sm p-3 rounded mb-5'>
                    {error}
                </div>
            )}

            {success && (
                <div className='bg-green-50 border-1-4 border-green-500 text-green-700 text-sm p-3 rounded mb-5'>
                    Cambios Guardados con Exito.
                </div>
            )}

            {/* Establishment's info */}
            <Section title='Informacion General'>
                <div className='space-y-4'>
                    <Field label="Nombre del Establecimiento">
                        <input name='name' value={form.name} onChange={handleChange}
                            className={inputClass}
                            placeholder='El lago de Yojoa' />
                    </Field>


                    <Field label="Categoria Principal">
                        <select name='category' value={form.category} onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="">Selecciona una categoria</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Descripcion">
                        <textarea name='description' value={form.description} onChange={handleChange}
                            className={`${inputClass} resize-none`}
                            rows={4}
                            placeholder='Descripcion...' />
                    </Field>
                </div>
            </Section>

            {/* Contact */}
            <Section title="Información de contacto">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Email">
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            className={inputClass} placeholder="tu@email.com" />
                    </Field>
                    <Field label="Teléfono">
                        <input name="phone" value={form.phone} onChange={handleChange}
                            className={inputClass} placeholder="+504 9999-9999" />
                    </Field>
                    <Field label="Sitio web" className="col-span-2">
                        <input name="website" value={form.website} onChange={handleChange}
                            className={inputClass} placeholder="www.misitioweb.com" />
                    </Field>
                    
                </div>
            </Section>

            {/* Location */}
            <Section title="Ubicación">
                <div className="space-y-4">
                    <Field label="Dirección">
                        <input name="address" value={form.address} onChange={handleChange}
                            className={inputClass}
                            placeholder="Santa Cruz de Yojoa, Cortés, Honduras" />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Latitud">
                            <input name="latitude" value={form.latitude} onChange={handleChange}
                                className={inputClass} placeholder="14.8847" />
                        </Field>
                        <Field label="Longitud">
                            <input name="longitude" value={form.longitude} onChange={handleChange}
                                className={inputClass} placeholder="-88.3628" />
                        </Field>
                    </div>
                    <p className="text-xs text-gray-400">
                        Puedes obtener las coordenadas haciendo clic derecho en Google Maps → "¿Qué hay aquí?"
                    </p>
                </div>
            </Section>

            <Section title="Horarios de atención">
                <div className="space-y-3">
                    {DAYS.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-4">
                            <span className="text-sm text-gray-700 w-24 shrink-0">{label}</span>

                            {hours[key]?.closed ? (
                                <span className="text-sm text-gray-400 flex-1">Cerrado</span>
                            ) : (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="time"
                                        value={hours[key]?.open || '08:00'}
                                        onChange={e => handleHoursChange(key, 'open', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400 text-sm">—</span>
                                    <input
                                        type="time"
                                        value={hours[key]?.close || '17:00'}
                                        onChange={e => handleHoursChange(key, 'close', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    checked={hours[key]?.closed || false}
                                    onChange={() => handleClosedToggle(key)}
                                    className="rounded"
                                />
                                Cerrado
                            </label>
                        </div>
                    ))}
                </div>
            </Section>

            <div className="mt-6">
                <button onClick={handleSave} disabled={isSaving}
                    className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>

        </div>
    )
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

function Section({ title, children }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
            {children}
        </div>
    );
}

function Field({ label, children, className = '' }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
        </div>
    );
}