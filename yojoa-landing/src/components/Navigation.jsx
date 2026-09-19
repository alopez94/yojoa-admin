import { useState } from 'react';
import logoAmanecer from '../assets/logoamanecer.svg';

export default function Navigation() {

    const [isOpen, setIsOpen] = useState(false);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
            setIsOpen(false)
        }
    }

    return (
        <nav className="fixed w-full bg-white shadow-lg z-50">
            <div className="max-w-7x1 mx-auto px-4 sm:px-6 lg:px-8">
                <div flex justify-between items-center h-16>
                    <div className="flex items-center gap-2">
                        <img
                            src={logoAmanecer}
                            alt="Yojoa Travel"
                            className="h-10 w-10"
                        />
                        <span className="text-xl font-bold text-gray-800">Yojoa Travel</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => scrollToSection('home')}
                            className="text-gray-700 hover:text-primary transition"
                        >
                            Inicio
                        </button>
                        <button
                            onClick={() => scrollToSection('home')}
                            className="text-gray-700 hover:text-primary transition"
                        >
                            ¿Qué hacemos?
                        </button>
                        <button
                            onClick={() => scrollToSection('home')}
                            className="text-gray-700 hover:text-primary transition"
                        >
                            Contacto
                        </button>
                        <button
                            href="https://business.yojoatravel.com"
                            className="text-gray-700 hover:text-primary transition"
                        >
                            Portal de Negocios
                        </button>

                    </div>

                    {isOpen && (
                        <div className='md:hidden pb-4 border-t'>
                            <button
                                onClick={() => scrollToSection('home')}
                                className='block w-full text-left px-4 py-4 text-gray-700 hover:bg-gray-100'
                            >
                                Inicio
                            </button>

                            <button
                                onClick={() => scrollToSection('home')}
                                className='block w-full text-left px-4 py-4 text-gray-700 hover:bg-gray-100'
                            >
                                ¿Qué hacemos?
                            </button>

                            <button
                                onClick={() => scrollToSection('home')}
                                className='block w-full text-left px-4 py-4 text-gray-700 hover:bg-gray-100'
                            >
                                Contacto
                            </button>

                            <button
                                href="https://business.yojoatravel.com"
                                className='block w-full text-left px-4 py-4 text-gray-700 hover:bg-gray-100'
                            >
                                Portal de Negocios
                            </button>
                        </div>

                    )}
                </div>
            </div>

        </nav>
    )

}