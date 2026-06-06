import { motion } from 'framer-motion'
import { heroData } from '../data/hero'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
}

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-20 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-dark pointer-events-none" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center max-w-4xl"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            {heroData.name}
          </h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <h2 className="text-2xl md:text-3xl text-light mb-4">
            {heroData.title}
          </h2>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            {heroData.description}
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-semibold transition-colors">
            {heroData.cta.primary}
          </button>
          <button className="px-8 py-3 border border-secondary text-secondary hover:bg-secondary/10 rounded-lg font-semibold transition-colors">
            {heroData.cta.secondary}
          </button>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-6 mt-12"
        >
          {Object.entries(heroData.social).filter(([key]) => key !== 'email').map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-primary/20 hover:bg-primary rounded-full flex items-center justify-center transition-colors"
            >
              <span className="capitalize text-sm">{key.charAt(0)}</span>
            </a>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-primary rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </motion.div>
    </section>
  )
}
