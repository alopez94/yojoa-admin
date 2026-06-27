import { useEffect, useState, useMemo } from "react";
import { getEstablishmentBookings } from "../../services/BookingsService";
import { useAuth } from "../../context/AuthContext";
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../config/firebase';

const STATUS_CONFIG = {
  confirmed:   { label: 'Confirmada',  color: 'text-green-700',  bg: 'bg-green-100'  },
  pending:     { label: 'Pendiente',   color: 'text-yellow-700', bg: 'bg-yellow-100' },
  in_progress: { label: 'En Proceso',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  completed:   { label: 'Completada',  color: 'text-indigo-700', bg: 'bg-indigo-100' },
  rejected:    { label: 'Rechazada',   color: 'text-red-700',    bg: 'bg-red-100'    },
  cancelled:   { label: 'Cancelada',   color: 'text-red-700',    bg: 'bg-red-50'     },
};

const FILTERS = [
  { key: 'all',         label: 'Todas'       },
  { key: 'confirmed',   label: 'Confirmadas' },
  { key: 'pending',     label: 'Pendientes'  },
  { key: 'in_progress', label: 'En Proceso'  },
  { key: 'completed',   label: 'Completadas' },
  { key: 'cancelled',   label: 'Canceladas'  },
];

export default function BookingsPage() {
  const { establishmentData } = useAuth();

  const [isLoading, setIsLoading]       = useState(false);
  const [bookings, setBookings]         = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');

  const loadBookings = async () => {
    if (!establishmentData?.id) return;
    setIsLoading(true);
    try {
      const results = await getEstablishmentBookings(establishmentData.id);
      setBookings(results);
    } catch (error) {
      console.log("error fetching bookings", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [establishmentData?.id]);

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
    } catch (error) {
      console.log("Error updating status:", error);
    } finally {
      setDeleteConfirm(null);
      loadBookings();
    }
  };

  // Filter + search applied together
  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Status filter
    if (activeFilter !== 'all') {
      result = result.filter(b => b.status === activeFilter);
    }

    // Search by tourist name
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.touristContactInfo?.name?.toLowerCase().includes(lower) ||
        b.activityName?.toLowerCase().includes(lower) ||
        b.confirmationCode?.toLowerCase().includes(lower)
      );
    }

    return result;
  }, [bookings, activeFilter, searchQuery]);

  return (
    <div className='p-8 max-w-5xl'>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reservaciones</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Gestiona las reservaciones de tus turistas
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, actividad o código..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeFilter === filter.key
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {filter.label}
            {activeFilter === filter.key && filteredBookings.length > 0 && (
              <span className="ml-1.5 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filteredBookings.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-400 mb-4">
          {filteredBookings.length} reservacion{filteredBookings.length !== 1 ? 'es' : ''} encontrada{filteredBookings.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className='text-sm text-gray-400 py-12 text-center'>
            Cargando reservaciones...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
            <p className="text-gray-400 text-sm">
              {searchQuery || activeFilter !== 'all'
                ? 'No se encontraron reservaciones con estos filtros.'
                : 'Aún no tienes reservaciones.'}
            </p>
          </div>
        ) : (
          filteredBookings.map(booking => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
            return (
              <div
                key={booking.id}
                className='bg-white border border-gray-200 rounded-xl p-4 flex justify-between gap-4'
              >
                {/* Left — booking info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-gray-900 truncate">
                      {booking.activityName}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-2">
                    <span className="text-xs text-gray-400">📅 {booking.date}</span>
                    <span className="text-xs text-gray-400">🕐 {booking.time}</span>
                    <span className="text-xs text-gray-400">👥 {booking.guestCount} personas</span>
                    <span className="text-xs text-gray-400">🔑 {booking.confirmationCode}</span>
                  </div>
                </div>

                {/* Middle — tourist info */}
                <div className="flex flex-col gap-1 shrink-0">
                  <span className="text-xs text-gray-600 font-medium">
                    👤 {booking.touristContactInfo?.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ✉️ {booking.touristContactInfo?.email}
                  </span>
                  {!!booking.touristContactInfo?.phone && (
                    <span className="text-xs text-gray-400">
                      📞 {booking.touristContactInfo?.phone}
                    </span>
                  )}
                </div>

                {/* Right — actions */}
                <div className='flex flex-col gap-2 shrink-0'>
                  {booking.status === "pending" && (
                    <>
                      <button
                        className='text-xs text-green-600 font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-green-200'
                        onClick={() => handleStatusUpdate(booking.id, "confirmed")}
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        className='text-xs text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-200'
                        onClick={() => handleStatusUpdate(booking.id, "rejected")}
                      >
                        ✕ Rechazar
                      </button>
                    </>
                  )}

                  {booking.status === "confirmed" && (
                    deleteConfirm === booking.id ? (
                      <div className='flex gap-1 items-center'>
                        <span className='text-xs text-gray-500'>¿Confirmar?</span>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                          className='text-xs text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50'
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(booking.id)}
                        className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
                      >
                        Cancelar
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}