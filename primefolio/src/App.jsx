import { useState } from 'react'
import Hero from './components/Hero'
import About from './components/About'
import LiveCounters from './components/LiveCounters'
import Projects from './components/Projects'
import Certifications from './components/Certifications'
import Volunteering from './components/Volunteering'
import Academic from './components/Academic'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Navigation from './components/Navigation'

function App() {
  return (
    <div className="min-h-screen bg-dark text-light">
      <Navigation />
      <Hero />
      <About />
      <LiveCounters />
      <Projects />
      <Academic />
      <Certifications />
      <Volunteering />
      <Contact />
      <Footer />
    </div>
  )
}

export default App
