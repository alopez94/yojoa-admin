import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from "../config/firebase"

export default function SingupPage() {

    const [form, setForm] = useState({
        firstName: ' ',
        lastName: ' ',
        email: ' ',
        phone: ' ',
        password: ' ',
        confirmPassword: ' ',
        establishmentName: '',
        address: ' ',
        category: ' ',
        description: ' ',
    });

    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const categories = [
        'Food & Dining',
        'Recreation & Adventure',
        'Lodging & Accommodation',
        'Nature & Outdoor',
        'Cultural & Historical',
        'Transportation',
    ];

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);

        if (form.password !== form.confirmPassword) {
            setError('Las Contraseñas deben coincidir');
            return
        }
        if (form.password.length < 6) {
            setError('La contraseña debe contener al menos 6 caracteres')
        }

        setIsLoading(true);

        try {
            //auth user
            const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
            //user on firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: form.email,
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
                role: 'establishment',
                profileImage: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            //create establishment
            const establishmentRef = doc(db, 'establishments', user.uid);
            await setDoc(establishmentRef, {
                ownerId: user.uid,
                name: form.establishmentName,
                description: form.description,
                category: form.category,
                secondaryCategories: [],
                address: form.address,
                latitude: null,
                longitude: null,
                phone: form.phone,
                email: form.email,
                website: '',
                logo: '',
                coverImage: '',
                photos: [],
                businessHours: {
                    monday: { open: '8:00', close: '17:00', closed: false },
                    tuesday: { open: '8:00', close: '17:00', closed: false },
                    webnesday: { open: '8:00', close: '17:00', closed: false },
                    thursday: { open: '8:00', close: '17:00', closed: false },
                    friday: { open: '8:00', close: '17:00', closed: false },
                    saturday: { open: '8:00', close: '17:00', closed: false },
                    sunday: { open: '8:00', close: '17:00', closed: false },
                },
                status: 'pending_approval',
                approvedBy: null,
                approvedAt: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

        }
        catch (error) {
            if (error.code === 'auth/email-already-in-us') {
                setError("Ya existe una cuenta con este correo");
            }
            else {
                setError('Algo salio mal :( Intenta de nuevo!')
                console.log("error", error);
            }
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
            <div className="bg-white rounded-x1 shadow-sm border border-gray-200 p-8 w-full max-w-lg">
                <h1 className="text-2x1 font-bold text-gray-900 mb-2"> Registra tu establecimiento </h1>
                <p className="text-gray-500 mb-8">Crea tu cuenta para empezar a gestionar tu negocio en YojoaTravel</p>

                {error && (
                    <div className="bg-red-50 border-1-4 border-red-500 text-red-700 p-4 rounded mb-6">
                        {error}
                    </div>
                )}

                

                <form onSubmit={handleSignup} className="space-y-5">

                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Informacion del propietario</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label block text-sm font-medium text-gray-700 mb-1>Nombre</label>
                                <input name="firstName" value={form.firstName} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Pedro"
                                    required
                                />
                            </div>
                            <div>
                                <label block text-sm font-medium text-gray-700 mb-1>Nombre</label>
                                <input name="lastName" value={form.lastName} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Fuentes"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label block text-sm font-medium text-gray-700 mb-1>Telefono</label>
                        <input name="phone" value={form.phone} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+504 9999-9999"
                            required
                        />
                    </div>

                    <div>
                        <label block text-sm font-medium text-gray-700 mb-1>Correo</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="tu@correo.com"
                            required
                        />
                    </div>

                    <div>
                        <label block text-sm font-medium text-gray-700 mb-1>Contraseña</label>
                        <input name="password" type="password" value={form.password} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="**********"
                            required
                        />
                    </div>

                    <div>
                        <label block text-sm font-medium text-gray-700 mb-1>Confirmar contraseña</label>
                        <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="**********"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Imformacion del Establecimiento</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Establecimiento</label>
                                <input name="establishmentName" value={form.establishmentName} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Lago de Yojoa" required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principal del Establecimiento</label>
                                <select name="category" value={form.category} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Lago de Yojoa" required>
                                    <option value=""> Selecciona una categoria </option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                                <input name="address" value={form.address} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Peña Blanca, Santa Cruz de" required
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                                <textarea name="description" value={form.description} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Descripcion..." required
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {isLoading ? 'Creando Cuenta...' : 'Cuenta Creada'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-100 pt-6">
                    <p className="text-gray-500 text-sm">
                        ¿Ya tienes cuenta?{' '}
                        <button onClick={() => navigate('/login')}
                            className="text-blue-600 font-semibold hover:underline">
                            Inicia sesión
                        </button>
                    </p>
                </div>

            </div>
        </div>
    )


}