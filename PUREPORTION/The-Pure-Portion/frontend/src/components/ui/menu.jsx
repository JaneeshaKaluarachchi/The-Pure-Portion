import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import '../../styles/Menu.css';

const sidebarVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

export const UserProfileSidebar = React.forwardRef(
  ({ user, navItems, logoutItem, className = '' }, ref) => {
    return (
      <motion.aside
        ref={ref}
        className={`user-profile-sidebar ${className}`}
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        aria-label="Restaurant feature menu"
      >
        {user && (
          <>
            <motion.div variants={itemVariants} className="menu-user-header">
              <img
                src={user.avatarUrl}
                alt={`${user.name}'s avatar`}
                className="menu-user-avatar"
              />
              <div className="menu-user-copy">
                <span className="menu-user-name">{user.name}</span>
                <span className="menu-user-email">{user.email}</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="menu-divider" />
          </>
        )}

        <nav className="menu-nav" role="navigation">
          {navItems.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {item.isSeparator && <motion.div variants={itemVariants} className="menu-spacer" />}
              <motion.a
                href={item.href || '#'}
                variants={itemVariants}
                className={`menu-nav-item ${item.isActive ? 'active' : ''}`}
                onClick={(event) => {
                  if (item.onClick) {
                    event.preventDefault();
                    item.onClick();
                  }
                }}
              >
                <span className="menu-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                <ChevronRight className="menu-nav-chevron" aria-hidden="true" />
              </motion.a>
            </React.Fragment>
          ))}
        </nav>

        <motion.div variants={itemVariants} className="menu-logout-wrap">
          <button onClick={logoutItem.onClick} className="menu-logout-button">
            <span className="menu-nav-icon">{logoutItem.icon}</span>
            <span>{logoutItem.label}</span>
          </button>
        </motion.div>
      </motion.aside>
    );
  }
);

UserProfileSidebar.displayName = 'UserProfileSidebar';
