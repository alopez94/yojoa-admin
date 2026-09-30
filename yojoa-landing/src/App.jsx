import './App.css'
import { useState } from 'react';

//pages
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import Contact from './components/Contact';
import Footer from './components/Footer';
import PrivacyPolicy from './components/privacypolicy';


function App() {
  const [count, setCount] = useState(0)

  return (
     <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      <Contact />
      <Footer />
      <PrivacyPolicy />
    </div>
  )
}

export default App
