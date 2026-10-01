import { useEffect, useState, useMemo } from "react";
import { getEstablishmentBookings } from "../../services/BookingsService";
import { useAuth } from "../../context/AuthContext";
import { updateDoc, doc } from "firebase/firestore";
import { db } from '../../config/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const confirmPaymentFn = httpsCallable(functions, 'confirmPaymentReceived');

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmada', color: 'text-green-700', bg: 'bg-green-100' },
  pending: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  pending_payment: { label: 'Pendiente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  in_progress: { label: 'En Proceso', color: 'text-blue-700', bg: 'bg-blue-100' },
  completed: { label: 'Completada', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  rejected: { label: 'Rechazada', color: 'text-red-700', bg: 'bg-red-100' },
  cancelled: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-50' },
};

const METHOD_LABEL = {
  cash: { label: 'Efectivo', bg: 'bg-gray-100', color: 'text-gray-700' },
  transfer: { label: 'Transferencia', bg: 'bg-gray-100', color: 'text-gray-700' },
  paypal: { label: 'PayPal', bg: 'bg-blue-50', color: 'text-blue-700' },
  card: { label: 'PayPal', bg: 'bg-blue-50', color: 'text-blue-700' },
};

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'pending_payment', label: 'Pendientes de Pago' },
  { key: 'in_progress', label: 'En Proceso' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
];

export default function BookingsPage() {
  const { establishmentData } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [paymentModal, setPaymentModal] = useState(null);   // booking completo
  const [paidAt, setPaidAt] = useState('');
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);


  const handleConfirmPayment = async () => {
    if (!paymentModal) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await confirmPaymentFn({
        bookingId: paymentModal.id,
        // El 'T12:00:00' evita que un input date se corra un día:
        // new Date('2026-09-30') se interpreta como medianoche UTC,
        // que en UTC-6 es el 29 a las 18:00.
        paidAt: paidAt ? `${paidAt}T12:00:00` : null,
        reference: reference.trim() || null,
      });

      setPaymentModal(null);
      setPaidAt('');
      setReference('');
      loadBookings();
    } catch (err) {
      console.error('Error confirmando pago:', err);
      setError(err?.message || 'No se pudo confirmar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };


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
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeFilter === filter.key
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
                    {!!booking.paymentMethod && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${METHOD_LABEL[booking.paymentMethod]?.bg || 'bg-gray-100'} ${METHOD_LABEL[booking.paymentMethod]?.color || 'text-gray-700'}`}>
                        {METHOD_LABEL[booking.paymentMethod]?.label || booking.paymentMethod}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {booking.paymentStatus === 'paid' ? '✅ Pagada' : '⏳ Sin pagar'}
                    </span>
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

                  {booking.status === "pending_payment" && (
                    <>
                      <button
                        className='text-xs text-green-600 font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors border border-green-200'
                        onClick={() => {
                          setPaymentModal(booking);
                          setPaidAt(new Date().toISOString().split('T')[0]);
                          setReference('');
                          setError(null);
                        }}
                      >
                        Registrar pago
                      </button>
                      <button
                        className='text-xs text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-200'
                        onClick={() => handleStatusUpdate(booking.id, "cancelled")}
                      >
                        ✕ Cancelar
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

      {paymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Registrar pago</h2>
            <p className="text-sm text-gray-500 mb-5">
              {paymentModal.activityName} · {paymentModal.confirmationCode}
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-5 flex justify-between">
              <span className="text-sm text-gray-500">Monto</span>
              <span className="text-sm font-semibold text-gray-900">
                {paymentModal.currency} {paymentModal.totalPrice?.toLocaleString()}
              </span>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha en que se recibió el pago
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={e => setPaidAt(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de referencia {paymentModal.paymentMethod === 'cash' && (
                <span className="text-gray-400 font-normal">(opcional)</span>
              )}
            </label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder={paymentModal.paymentMethod === 'transfer'
                ? 'Número de la transferencia'
                : 'Número de recibo'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {!!error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mb-5">
              Al confirmar, la reserva pasa a confirmada y el turista recibe un correo.
              Esta acción queda registrada y no se puede deshacer.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPaymentModal(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isSubmitting || !paidAt}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Registrando...' : 'Confirmar pago recibido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}