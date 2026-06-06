import { motion } from 'framer-motion'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-12 px-4 bg-dark border-t border-primary/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row justify-between items-center"
        >
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Prime
            </h3>
            <p className="text-gray-400 text-sm">
              Full-stack developer & cloud architect
            </p>
          </div>

          <nav className="flex gap-8 my-4 md:my-0">
            {[
              { name: 'Home', href: '#home' },
              { name: 'About', href: '#about' },
              { name: 'Projects', href: '#projects' },
              { name: 'Contact', href: '#contact' }
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-400 hover:text-primary transition-colors text-sm"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="flex gap-4 mt-4 md:mt-0">
            {[
              { name: 'GitHub', icon: 'GH' },
              { name: 'LinkedIn', icon: 'in' },
              { name: 'Twitter', icon: 'tw' }
            ].map((social) => (
              <a
                key={social.name}
                href="#"
                className="w-10 h-10 bg-primary/20 hover:bg-primary rounded-full flex items-center justify-center transition-colors text-xs font-bold"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-8 pt-8 border-t border-primary/20 text-center text-gray-500 text-sm"
        >
          <p>© {currentYear} Prime. All rights reserved.</p>
          <p className="mt-2">Built with React, Tailwind CSS & Framer Motion. Deployed on Vercel.</p>
        </motion.div>
      </div>
    </footer>
  )
}
