import { motion } from 'framer-motion'
import { aboutData } from '../data/about'

export default function About() {
  return (
    <section id="about" className="py-20 px-4 bg-gradient-to-b from-dark to-dark/80">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          {aboutData.title}
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img
              src={aboutData.image}
              alt="Profile"
              className="rounded-lg w-full h-96 object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
              {aboutData.bio}
            </p>

            <div className="space-y-3 mb-8">
              {aboutData.highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-light">{highlight}</span>
                </motion.div>
              ))}
            </div>

            <button className="px-8 py-3 bg-secondary hover:bg-secondary/80 text-white rounded-lg font-semibold transition-colors">
              Download CV
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
