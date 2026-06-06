import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { statsData } from '../data/stats'

const Counter = ({ target, suffix, label }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let interval
    if (count < target) {
      interval = setInterval(() => {
        setCount(prev => Math.min(prev + Math.ceil(target / 50), target))
      }, 30)
    }
    return () => clearInterval(interval)
  }, [target])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center p-6 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
    >
      <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
        {count}{suffix}
      </div>
      <p className="text-light text-lg">{label}</p>
    </motion.div>
  )
}

export default function LiveCounters() {
  return (
    <section className="py-20 px-4 bg-dark">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          By The Numbers
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat) => (
            <Counter
              key={stat.id}
              target={stat.value}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
