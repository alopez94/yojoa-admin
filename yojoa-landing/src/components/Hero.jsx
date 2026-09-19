import logoAmanecer from '../assets/logoamanecer.svg';


export default function Hero() {
  return (
    <section id="home" className="pt-24 pb-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Descubre las Mejores Actividades del Lago de Yojoa
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Reserva actividades turísticas en la cuenca del Yojoa de forma fácil y segura. Desde aventuras en la naturaleza hasta experiencias culturales, encuentra y reserva tu próxima experiencia inolvidable.
            </p>
            <div className="flex gap-4">
              <a
                href="https://business.yojoatravel.com"
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
              >
                Comenzar
              </a>
              <button
                onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition text-lg"
              >
                Saber Más
              </button>
            </div>
          </div>
 
          {/* Right Image/Illustration */}
          <div className="flex items-center justify-center">
            <div className="relative w-full h-96 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl shadow-2xl flex items-center justify-center">
              <div className="text-center">
                <img 
                  src={logoAmanecer} 
                  alt="Yojoa Travel Logo" 
                  className="h-32 w-32 mx-auto mb-4"
                />
                <p className="text-white text-xl font-semibold">Lago de Yojoa</p>
                <p className="text-blue-100">El Tesoro Natural de Honduras</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
 