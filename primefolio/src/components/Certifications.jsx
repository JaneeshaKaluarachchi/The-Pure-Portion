import { motion } from 'framer-motion'
import { certificationsData } from '../data/certifications'

export default function Certifications() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-dark to-dark/80">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          Certifications
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {certificationsData.map((cert, index) => (
            <motion.a
              key={cert.id}
              href={cert.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 bg-primary/10 border border-primary/30 rounded-lg hover:border-secondary hover:bg-primary/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-light group-hover:text-secondary transition-colors">
                    {cert.title}
                  </h3>
                  <p className="text-primary text-sm font-semibold mt-1">{cert.issuer}</p>
                </div>
                <span className="text-secondary text-sm ml-2">{cert.date}</span>
              </div>
              <p className="text-gray-400 text-sm">ID: {cert.credentialId}</p>
              <p className="text-primary text-sm mt-3 group-hover:translate-x-1 transition-transform">
                View Credential →
              </p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
