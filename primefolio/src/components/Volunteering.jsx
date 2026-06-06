import { motion } from 'framer-motion'
import { volunteeringData } from '../data/volunteering'

export default function Volunteering() {
  return (
    <section className="py-20 px-4 bg-dark">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          Volunteering & Community
        </motion.h2>

        <div className="space-y-6">
          {volunteeringData.map((volunteer, index) => (
            <motion.div
              key={volunteer.id}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 bg-secondary/10 rounded-lg border-l-4 border-secondary hover:bg-secondary/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                <div>
                  <h3 className="text-2xl font-bold text-light">{volunteer.organization}</h3>
                  <p className="text-secondary font-semibold text-lg">{volunteer.role}</p>
                </div>
                <p className="text-gray-400 mt-2 md:mt-0 md:text-right">{volunteer.period}</p>
              </div>
              <p className="text-gray-300 mb-3">{volunteer.description}</p>
              <div className="flex items-center space-x-2 text-primary">
                <span className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-sm font-semibold">{volunteer.impact}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
