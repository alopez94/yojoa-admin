
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

  const handleConfirmation = async (bookingid) => {
    try{
      const bookingRef = doc(db,'bookings',bookingid);
      await updateDoc(bookingRef,{
        status:'confirmed'
      });
    }
    catch(error){
      console.log("Error confirming reservation: ",error)
    }
    finally{
      loadBookings();
    }

  }

   const handleCancellation = async (bookingid) => {
    try{
      const bookingRef = doc(db,'bookings',bookingid);
      await updateDoc(bookingRef,{
        status:'cancelled'
      });
    }
    catch(error){
      console.log("Error confirming reservation: ",error)
    }
    finally{
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
        {
          bookings.map(booking => (
            <div key={booking.id}
              className='bg-white border border-gray-200 rounded-xl flex-col p-5'
            >
              <div className="flex justify-between">

                <div className="text-xl  text-gray-900 p-1">
                  Estado: {booking.status === "confirmed" ? (
                    <div className="text-xl text-green-600">
                      Confirmado
                    </div>
                  ) : booking.status === "pending" ? (
                    <div className="text-xl text-yellow-600">
                      Pendiente
                    </div>
                  ) : booking.status === "rejected" ? (
                    <div className="text-xl text-red-800">
                      Rechazada
                    </div>
                  ) : (
                    <div className="text-xl text-red-600">
                      Cancelada
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

      </div>


    </div>

  )
}