import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addDoc, doc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getEstablishmentUsers } from '../../services/EstablishmentService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

const maxUsers = 3;

const empty_employeeform = {
    firstName: '',
    lastName: '',
    email: '',
    establishmentName: '',
    role: '',
    position: '',
    location: '',
    status: '',
    isEmployee: '',
    isDeleted: ''

}


export default function UsersPage() {

    const createEmployeeAccountFn = httpsCallable(functions, 'createEmployeeAccount');

    const { establishmentData } = useAuth();

    const [openModal, setOpenModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState(null);
    const [form, setForm] = useState(empty_employeeform);
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false);
    const [users, setUsers] = useState([])
    const [maxUsersCreated, setMaxUsersCreated] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        //load users
        fetchUsers();
    }, [openModal])

    const fetchUsers = async () => {

        setIsLoading(true);

        try {
            const results = await getEstablishmentUsers(establishmentData.id);
            if (results.length >= maxUsers) setMaxUsersCreated(true);
            setUsers(results);
        }
        catch (error) {
            console.log("Error fetching users: ", error);
        }

        setIsLoading(false);
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    const validateForm = () => {
        console.log(form)
        if (!form.firstName.trim()) { setError("El nombre es requerido"); return false; };
        if (!form.lastName.trim()) { setError("El apellido es requerido"); return false; }
        if (!form.email.trim()) { setError("El nombre es requerido");; return false; }
        return true;
    }

    const openEdit = (user) => {
        setIsEditing(true);
        setEditingUser(user);
        setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            position: user.position,
            location: user.location,
            status: user.status
        })

        setError(null);
        setOpenModal(true);
    }

    const handleDelete = (user) => {

    }

    const handleCancelForm = () => {
        setForm(empty_employeeform);
        setOpenModal(false);
    }

    const handleSave = async () => {
        if (!establishmentData?.id) {
            setError('No se pudo identificar tu establecimiento. Recarga la página.');
            setIsSaving(false);
            return;
        }

        if (!validateForm()) return;

        setIsSaving(true);
        setError(null);

        const payload = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            establishmentId: establishmentData.id,
            role: 'establishment_employee',
            position: form.position.trim(),
            location: form.location.trim(),
            status: form.status.trim(),
            isEmployee: true,
            isDeleted: false

        };
        console.log("saved: ", payload)

        try {
            if (editingUser) {
                console.log(editingUser);
                await updateDoc(doc(db, 'users', editingUser.id), {
                    ...payload,
                    updatedAt: serverTimestamp(),
                });

            }
            else {

                await createEmployeeAccountFn({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    email: form.email.trim(),
                    position: form.position.trim(),
                    location: form.location.trim(),
                    establishmentId: establishmentData.id,
                });
            }

            setOpenModal(false);
            setIsEditing(false);
            setEditingUser(null);
            setForm(empty_employeeform);

        }
        catch (error) {
            if (error.code === 'already-exists') {
                setError('Este email ya tiene una cuenta registrada');
            } else {
                setError('Error al guardar. Intenta de nuevo.');
                console.error(error);
            }
        }
        finally {
            setIsSaving(false);
        }



    }


    return (
        <div className='p-8 max-w-3x1'>
            <div className='flex flex-row justify-between'>
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Usuarios</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Administra los usuarios de tu establecimiento
                    </p>

                </div>

                <button
                    onClick={() => setOpenModal(true)}
                    className="bg-green-400 text-white p-1 text-sm font-medium py-2 rounded-lg hover:bg-green-700 disable:opacity-50 transition-colors"
                    disabled={maxUsersCreated}
                >
                    Agregar Usuarios
                </button>
            </div>
            {/* Form for adding or editing */}

            {error &&
                <div>
                    <h1>Error: {error}</h1>
                </div>
            }

            {openModal &&
                <div className='bg-white border border-gray-200 rounded-xl p-6 mb-6'>
                    <h2>
                        {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>

                    {error && (
                        <div className='bg-red-50 border-red-500 text-red-700 text-sm p-3 rounded mb-5'>
                            {error}
                        </div>
                    )}

                    <div className='grid grid-cols-3 gap-4'>

                        <div >
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Nombre</label>
                            <input
                                name='firstName'
                                value={form.firstName}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>

                        <div >
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Apellido</label>
                            <input
                                name='lastName'
                                value={form.lastName}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>

                        <div >
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                            <input
                                name='email'
                                placeholder='@yojoatravel.com'
                                value={form.email}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                type='email'
                            />
                        </div>

                        <div >
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Puesto</label>
                            <input
                                name='position'
                                placeholder='Atencion al cliente'
                                value={form.position}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        {
                            editingUser &&
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Estado</label>
                                <select
                                    name='status'
                                    value={form.status}
                                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                                    onChange={handleChange}
                                    defaultValue={'Active'}
                                >
                                    <option key='1' value={'Active'}>Activo</option>
                                    <option key='2' value={'Suspended'}>Suspendido</option>
                                </select>
                            </div>
                        }
                        <div >
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Ubicacion</label>
                            <input
                                name='location'
                                placeholder='Kayaks'
                                value={form.location}
                                onChange={handleChange}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>

                    </div>

                    <div className='flex gap-3 mt-6'>
                        <button
                            onClick={handleSave}
                            className='bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors'
                            disabled={isLoading}
                        >
                            Guardar
                        </button>

                        <button
                            onClick={handleCancelForm}
                            className='bg-red-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors'

                        >
                            Cancelar
                        </button>

                    </div>


                </div>
            }


            {/* show existing users */}

            {isLoading ? (
                <div> Cargando Actividad </div>
            ) : users.length === 0 && !openModal ? (
                <div>
                    Crea tus usuarios
                </div>
            ) : !openModal && (
                <div className='space-y-3 my-5'>

                    {users.map(user => (
                        <div key={user.id}
                            className='bd-white border border-gray-200 rounded-xl grid grid-cols-4 gap-4 justify-between'
                        >

                            <div>
                                <label>Name: </label>
                                <p>{user.firstName} {user.lastName}</p>
                            </div>
                            <div >
                                <label>Email: </label>
                                <p>{user.email}</p>
                            </div>
                            <div >
                                <label>Estado: </label>
                                <p>{user.status}</p>
                            </div>


                            <div className='flex gap-4'>
                                <button
                                    className='text-sm text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-50 transition-colors'
                                    onClick={() => openEdit(user)}
                                >
                                    Edit
                                </button>
                                {deleteConfirm === user.id ?
                                    (
                                        <div className='flex gap-1 items-center'>
                                            <span className='text-sm text-gray-500'>Confirmar?</span>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className='text-sm text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50'>
                                                Si
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(null)}
                                                className="text-sm text-gray-500 px-2 py-1 rounded hover:bg-gray-100">
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(user.id)}
                                            className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                            Eliminar
                                        </button>
                                    )
                                }

                            </div>


                        </div>
                    ))}

                </div>
            )}
        </div>
    )
}