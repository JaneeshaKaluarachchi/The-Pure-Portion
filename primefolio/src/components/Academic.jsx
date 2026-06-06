import { motion } from 'framer-motion'
import { academicsData } from '../data/academics'

export default function Academic() {
  return (
    <section className="py-20 px-4 bg-dark">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          Education
        </motion.h2>

        <div className="space-y-8">
          {academicsData.map((edu, index) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="p-6 bg-primary/10 rounded-lg border-l-4 border-secondary hover:bg-primary/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
                <div>
                  <h3 className="text-2xl font-bold text-light">{edu.degree}</h3>
                  <p className="text-primary font-semibold">{edu.field}</p>
                </div>
                <div className="text-right mt-4 md:mt-0">
                  <p className="text-secondary font-semibold">{edu.year}</p>
                  <p className="text-gray-400">GPA: {edu.gpa}</p>
                </div>
              </div>
              <p className="text-gray-400 mb-3">{edu.institution}</p>
              <div className="flex flex-wrap gap-2">
                {edu.highlights.map((highlight) => (
                  <span key={highlight} className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm">
                    {highlight}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
