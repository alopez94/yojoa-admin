
import { useEffect, useState } from "react";
import { getEstablishmentBookings } from "../../services/BookingsService";
import { useAuth } from "../../context/AuthContext";
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../config/firebase';

export default function BookingsPage() {

  const [isLoading, setIsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const { establishmentData } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(false);



  const loadBookings = async () => {

    if (!establishmentData?.ownerId) return;

    setIsLoading(true);

    try {

      const results = await getEstablishmentBookings(establishmentData?.ownerId);
      setBookings(results);
      setBookingsCount(results?.length || 0)

    }
    catch (error) {
      console.log("error fetcking bookings", error);
    }
    finally {
      setIsLoading(false);
    }
  }



  const handleStatusUpdate = async (bookingid, status) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingid);
      await updateDoc(bookingRef, {
        status: status
      });
    }
    catch (error) {
      console.log("Error confirming reservation: ", error)
    }
    finally {
      loadBookings();
    }

  }



  useEffect(() => {
    loadBookings();
  }, [establishmentData?.ownerId,])

  return (
    <div className='p-8 m-w-5x1'>

      <div className="flex items-center justify-between mb-6">
        <div className="p-8">
          <h1 className="text-xl font-semibold text-gray-900">Reservaciones</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona las reservaciones de tus turistas</p>
          <p className="text-sm text-gray-800 mt-5">Listado de Reservaciones</p>
        </div>
      </div>

      <div className="space-y-3">

        {isLoading ? (
          <div className='text-sm text-gray-900 py-12 text-center'>Cargando Reservaciones...</div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
            <p className="text-gray-400 text-sm">Aún no tienes reservaciones.</p>

          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(booking => (
              <div
                key={booking.id}
                className='bg-white border border-gray-200 rounded-xl flex justify-between gap-4 p-2'
              >
                <div className="min-w-0  flex-row jutify-between">
                  <div >
                    <p className="font-medium text-gray-900">Actividad: {booking.activityName}</p>
                    <p className="font-medium text-gray-900">

                      Estado:
                      {booking.status === "confirmed" ?
                        (
                          <div className="text-xl text-green-600">
                            Confirmado
                          </div>)
                        : booking.status === "pending" ?
                          (
                            <div className="text-xl text-yellow-600">
                              Pendiente
                            </div>
                          )
                          : booking.status === "in_progress" ?
                            (
                              <div className="text-xl text-blue-400">
                                En Proceso
                              </div>
                            ) :

                            booking.status === "completed" ?
                              (
                                <div className="text-xl text-blue-600">
                                  Completada
                                </div>
                              ) :

                              booking.status === "rejected" ?
                                (
                                  <div className="text-xl text-red-800">
                                    Rechazada
                                  </div>
                                ) :

                                booking.status === "cancelled" ?
                                  (
                                    <div className="text-xl text-red-600">
                                      Cancelada
                                    </div>
                                  ) :

                                  (
                                    <div className="text-xl text-red-600">
                                      Error en Status
                                    </div>
                                  )
                      }
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-xs text-gray-400">Fecha: {booking.date}</span>
                      <span className="text-xs text-gray-400">Hora: {booking.time}</span>
                      <span className="text-xs text-gray-400">Participantes: {booking.guestCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <span className="text-xs text-gray-400">Nombre en la reservacion: {booking.touristContactInfo.name}</span>
                  <span className="text-xs text-gray-400">Correo electronico: {booking.touristContactInfo.email}</span>
                </div>
                <div className='flex gap-2 shrink-0'>
                  {booking.status === "pending" && <button
                    className='text-xs text-green-600 font-medium px-3 py-1.5 rounded-lg hover:bg-50 transition-colors'
                    onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                  >
                    Confirmar
                  </button>}
                  {booking.status === "pending" && <button
                    className='text-xs text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-50 transition-colors'
                    onClick={() => handleStatusUpdate(booking.id, "rejected")}
                  >
                    Rechazar
                  </button>}
                  

                  {deleteConfirm === booking.id  ?
                    (
                      <div className='flex gap-1 items-center'>
                        <span className='text-xs text-gray-500'>Confirmar?</span>
                        <button
                          onClick={() => handleStatusUpdate(booking.id,"cancelled")}
                          className='text-xs text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50'>
                          Si
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100">
                          No
                        </button>
                      </div>
                    ) : booking.status === "confirmed" &&
                    (
                      <button onClick={() => setDeleteConfirm(booking.id)}
                        className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        Cancelar
                      </button>
                    )
                  }


                </div>
              </div>
            ))

            }
          </div>
        )}

        {/* 
        {
          bookings.map(booking => (
            <div key={booking.id}
              className='bg-white border border-gray-200 rounded-xl flex-col p-5'
            >
              <div className="flex justify-between">

                <div className="text-xl  text-gray-900 p-1">
                  Estado: {booking.status === "confirmed" ?
                    (
                      <div className="text-xl text-green-600">
                        Confirmado
                      </div>)
                    : booking.status === "pending" ? (
                      <div className="text-xl text-yellow-600">
                        Pendiente
                      </div>
                    ) : booking.status === "rejected" ? (
                      <div className="text-xl text-red-800">
                        Rechazada
                      </div>
                    ) : booking.status === "in_progress" ? (
                      <div className="text-xl text-green-300">
                        En Proceso
                      </div>
                    ) : (
                      <div className="text-xl text-blue-600">
                        Completada!
                      </div>
                    )
                  }
                </div>
                <div>
                  {booking.status === "pending" && (<button
                    className="text-xs text-green-600 font-medium px-3 py-1.5 rounded-lg hover:bg-50 transition-colors"
                    onClick={() => handleConfirmation(booking.id)}
                  >
                    Confirmar Reservacion
                  </button>)}
                  {booking.status === "confirmed" && <button
                    className="text-xs text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-50 transition-colors "
                    onClick={() => handleCancellation(booking.id)}
                  >
                    Rechazar Reservacion
                  </button>}
                </div>
              </div>


              <div className="text-xl font-semibold text-gray-900 p-1">
                {booking.activityName}
              </div>

              <div className="flex justify-between gap-4 m-2">

                <div className="text-sm font-semibold text-gray-900 ml-5">
                  Fecha de actividad  : {booking.date}
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-5">
                  Numero de personas en la reservacion: {booking.guestCount}
                </div>
              </div>

              <div className="flex justify-between gap-4 m-2">
                <div className="text-sm font-semibold text-gray-900 ml-5">
                  Nombre: {booking.touristContactInfo.name}
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-5">
                  Telefono: {booking.touristContactInfo.phone}
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-5">
                  Correo Electronico: {booking.touristContactInfo.email}
                </div>
              </div>

            </div>
          ))
        }
          */}

      </div>


    </div>

  )
}