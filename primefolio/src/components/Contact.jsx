import { motion } from 'framer-motion'
import { useState } from 'react'
import { contactData } from '../data/contact'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Using Formspree
      if (contactData.formspreeId && contactData.formspreeId !== 'YOUR_FORMSPREE_ID') {
        const response = await fetch(`https://formspree.io/f/${contactData.formspreeId}`, {
          method: 'POST',
          body: JSON.stringify(formData),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          setSubmitted(true)
          setFormData({ name: '', email: '', subject: '', message: '' })
          setTimeout(() => setSubmitted(false), 3000)
        }
      } else {
        // Fallback: log to console if no Formspree ID
        console.log('Form submitted:', formData)
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 3000)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <section id="contact" className="py-20 px-4 bg-gradient-to-b from-dark to-dark/80">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          {contactData.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-center text-gray-400 mb-12"
        >
          {contactData.description}
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { label: 'Email', value: contactData.email, icon: '✉' },
            { label: 'Phone', value: contactData.phone, icon: '📱' },
            { label: 'Location', value: contactData.location, icon: '📍' }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center p-4 bg-primary/10 rounded-lg"
            >
              <span className="text-3xl mb-2 block">{item.icon}</span>
              <p className="text-gray-400 text-sm mb-1">{item.label}</p>
              <p className="text-light font-semibold">{item.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          onSubmit={handleSubmit}
          className="bg-primary/10 p-8 rounded-lg space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="bg-dark/50 border border-primary/30 rounded-lg px-4 py-3 text-light placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-dark/50 border border-primary/30 rounded-lg px-4 py-3 text-light placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full bg-dark/50 border border-primary/30 rounded-lg px-4 py-3 text-light placeholder-gray-500 focus:outline-none focus:border-primary"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            value={formData.message}
            onChange={handleChange}
            required
            rows="5"
            className="w-full bg-dark/50 border border-primary/30 rounded-lg px-4 py-3 text-light placeholder-gray-500 focus:outline-none focus:border-primary"
          />
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-semibold transition-colors"
            >
              Send Message
            </button>
            {submitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-secondary font-semibold"
              >
                ✓ Message sent!
              </motion.div>
            )}
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center gap-6 mt-12"
        >
          {Object.entries(contactData.social).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-primary/20 hover:bg-primary rounded-full flex items-center justify-center transition-colors capitalize"
            >
              {key.charAt(0).toUpperCase()}
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
