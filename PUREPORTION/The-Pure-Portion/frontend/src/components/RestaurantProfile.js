import React, { useState, useEffect } from 'react';
import '../styles/RestaurantProfile.css';

const RestaurantProfile = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurantData, setRestaurantData] = useState({
    name: 'Your Restaurant Name',
    logo: '/logo.png',
    tagline: 'Manage Your Restaurant with Pure Portion',
    description: 'Complete restaurant management solution for inventory, staff, recipes, and operations.',
    email: 'admin@yourrestaurant.com',
    phone: '+1 (555) 000-0000',
    address: 'Your Restaurant Address',
    hours: {
      weekday: '11:00 AM - 10:00 PM',
      weekend: '10:00 AM - 11:00 PM'
    },
    vision: 'Pure Portion empowers restaurants to streamline operations, reduce food waste, and deliver exceptional dining experiences.',
    features: [
      { icon: '📦', title: 'Inventory Management', description: 'Track ingredients, manage stock, and reduce waste' },
      { icon: '👨‍🍳', title: 'Recipe Management', description: 'Organize recipes, portion plans, and meal details' },
      { icon: '👥', title: 'Staff Management', description: 'Manage staff attendance, roles, and performance' },
      { icon: '💰', title: 'Finance Tracking', description: 'Monitor revenue, expenses, and profitability' },
      { icon: '♻️', title: 'Leftover Management', description: 'Track and manage food leftovers efficiently' },
      { icon: '📊', title: 'Analytics & Reports', description: 'Get insights with detailed reports and analytics' }
    ],
    benefits: [
      { number: '50%', label: 'Reduce Food Waste' },
      { number: '30%', label: 'Save Time on Admin' },
      { number: '40%', label: 'Improve Efficiency' },
      { number: '100%', label: 'Digital Management' }
    ]
  });

  return (
    <div className="restaurant-profile">
      {/* Navigation Header */}
      <header className="profile-header">
        <div className="header-wrapper">
          <div className="logo-section">
            <img src="/logo.png" alt="Pure Portion Logo" className="header-logo" />
          </div>
          
          <button className="hamburger-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <nav className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-images">
          <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop" alt="Fresh Vegetables" className="hero-main" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">🚀 Powered by Pure Portion</div>
          <h1 className="hero-title">Restaurant Management Dashboard</h1>
          <p className="hero-subtitle">{restaurantData.tagline}</p>
          <p className="hero-description">All-in-one platform for restaurants to manage inventory, staff, recipes, and operations efficiently.</p>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">About Pure Portion</h2>
              <p className="section-description">A comprehensive restaurant management platform designed to simplify operations for modern restaurants.</p>
              <p className="about-details">
                Pure Portion is built for restaurants of all sizes - from small cafes to large dining chains. 
                Our platform helps you manage everything from inventory and recipes to staff attendance and finances. 
                Reduce food waste, improve efficiency, and make data-driven decisions with our intuitive dashboard and powerful analytics.
              </p>
              <div className="about-ctas">
                <button className="btn btn-primary">Get Started Now</button>
                <button className="btn btn-secondary">View Demo</button>
              </div>
            </div>
            <div className="about-image">
              <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop" alt="Restaurant Management" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Core Features</h2>
          <div className="features-grid">
            {restaurantData.features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title" style={{color: '#ffffff'}}>Platform Benefits</h2>
          <div className="benefits-grid">
            {restaurantData.benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-number">{benefit.number}</div>
                <div className="benefit-label">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="vision-section">
        <div className="container">
          <div className="vision-content">
            <div className="vision-card">
              <div className="vision-icon">🎯</div>
              <h3 className="vision-title">Our Vision</h3>
              <p className="vision-text">{restaurantData.vision}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2 className="section-title">Get In Touch With Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div>
                  <h4>Email Support</h4>
                  <p>support@pureportion.com</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div>
                  <h4>Phone Support</h4>
                  <p>+1 (800) PURE-POR</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">💬</div>
                <div>
                  <h4>Live Chat</h4>
                  <p>Available 24/7 for urgent issues</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📚</div>
                <div>
                  <h4>Documentation</h4>
                  <p>Access our comprehensive guides</p>
                </div>
              </div>
            </div>
            <div className="contact-form">
              <h3>Send us a Message</h3>
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Your Name" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" required />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Restaurant Name (Optional)" />
                </div>
                <div className="form-group">
                  <textarea placeholder="Tell us how we can help..." rows="5" required></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="restaurant-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4 className="footer-title">Pure Portion</h4>
              <p className="footer-description">Restaurant management platform for modern establishments.</p>
              <div className="social-links">
                <a href="#" className="social-icon">f</a>
                <a href="#" className="social-icon">𝕏</a>
                <a href="#" className="social-icon">in</a>
                <a href="#" className="social-icon">yt</a>
              </div>
            </div>
            <div className="footer-section">
              <h5 className="footer-subtitle">Product</h5>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#roadmap">Roadmap</a></li>
                <li><a href="#blog">Blog</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h5 className="footer-subtitle">Company</h5>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#team">Team</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h5 className="footer-subtitle">Legal</h5>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Pure Portion. All rights reserved. | Empowering restaurants worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RestaurantProfile;
