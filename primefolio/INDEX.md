# Primefolio Project Structure & File Guide

## 📚 Documentation Files

```
├── README.md              ← Start here! Full documentation
├── QUICK_REFERENCE.md     ← 5-minute quick start
├── GETTING_STARTED.md     ← Detailed setup guide
├── DEPLOYMENT.md          ← How to deploy to Vercel/Netlify
├── CUSTOMIZATION.md       ← How to personalize everything
├── FAQ.md                 ← Answers to common questions
└── THIS FILE              ← Project structure overview
```

**READ FIRST**: Start with `README.md` for complete overview

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:5173

# 4. Edit files in src/data/ and see changes instantly
```

---

## 📁 Complete Project Structure

```
primefolio/
│
├── 📄 Configuration Files
│   ├── package.json           ← Dependencies & scripts
│   ├── vite.config.js         ← Vite configuration
│   ├── tailwind.config.js     ← Color & style configuration
│   ├── postcss.config.js      ← PostCSS plugins
│   ├── vercel.json            ← Vercel deployment config
│   ├── .gitignore             ← Git ignore rules
│   ├── .env.example           ← Environment variables template
│   └── setup.sh               ← Setup script
│
├── 📚 Documentation
│   ├── README.md
│   ├── QUICK_REFERENCE.md
│   ├── GETTING_STARTED.md
│   ├── DEPLOYMENT.md
│   ├── CUSTOMIZATION.md
│   ├── FAQ.md
│   └── INDEX.md (this file)
│
├── src/
│   │
│   ├── 🎨 Components
│   │   ├── Navigation.jsx      ← Sticky navigation bar
│   │   ├── Hero.jsx            ← Landing hero section
│   │   ├── About.jsx           ← About me section
│   │   ├── LiveCounters.jsx    ← Animated statistics
│   │   ├── Projects.jsx        ← Projects showcase
│   │   ├── Academic.jsx        ← Education section
│   │   ├── Certifications.jsx  ← Certifications section
│   │   ├── Volunteering.jsx    ← Volunteer work section
│   │   ├── Contact.jsx         ← Contact form
│   │   └── Footer.jsx          ← Footer with links
│   │
│   ├── 📊 Data Files (EDIT THESE!)
│   │   ├── hero.js            ← Your name, title, social links
│   │   ├── about.js           ← Bio and highlights
│   │   ├── projects.js        ← Your projects (featured + others)
│   │   ├── academics.js       ← Education/degrees
│   │   ├── certifications.js  ← Professional certs
│   │   ├── volunteering.js    ← Volunteer work
│   │   ├── stats.js           ← Live counter numbers
│   │   └── contact.js         ← Contact info & form setup
│   │
│   ├── 🖼️ Assets
│   │   └── (For images you import in components)
│   │
│   ├── App.jsx               ← Main app component
│   ├── main.jsx              ← React entry point
│   └── index.css             ← Global styles
│
├── public/
│   ├── 🖼️ Images
│   │   ├── images/
│   │   │   ├── hero.svg
│   │   │   ├── about.svg
│   │   │   ├── project1.svg
│   │   │   ├── project2.svg
│   │   │   ├── project3.svg
│   │   │   └── (add your images here)
│   │   │
│   │   ├── cv.pdf           ← Your resume (replace this)
│   │   └── favicon.svg      ← Site icon
│   │
│   └── (static assets served as-is)
│
├── node_modules/            ← Installed packages (don't edit)
├── dist/                    ← Production build (auto-generated)
└── .git/                    ← Git repository (if initialized)
```

---

## 🎯 Key Files to Edit

### For Content Changes
```
src/data/hero.js           ← Your name, title, links
src/data/about.js          ← Your bio
src/data/projects.js       ← Your projects
src/data/academics.js      ← Education
src/data/certifications.js ← Certifications
src/data/volunteering.js   ← Volunteer work
src/data/contact.js        ← Contact form setup
```

### For Design Changes
```
tailwind.config.js         ← Colors, fonts, spacing
src/index.css              ← Global styles
src/components/            ← Individual component styling
```

### For Configuration
```
package.json               ← Dependencies
vite.config.js            ← Build config
vercel.json               ← Vercel settings
.env.local                ← Environment variables (create if needed)
```

---

## 🔄 Development Workflow

### 1. Start Development Server
```bash
npm run dev
```
- Opens http://localhost:5173
- Hot reload: changes appear instantly
- Keep terminal running

### 2. Edit Content
```
src/data/hero.js          ← Update your info
src/data/projects.js      ← Add projects
public/images/            ← Add your images
```

### 3. Test Changes
- Refresh browser to see updates
- Changes in data files appear instantly
- Component edits may need refresh

### 4. Build for Production
```bash
npm run build
```
- Creates optimized `dist/` folder
- Ready to deploy

### 5. Deploy
```bash
# Push to GitHub
git push

# Vercel/Netlify auto-deploys
# Or manually deploy to platform of choice
```

---

## 📝 Data Files Deep Dive

Each file in `src/data/` is a JavaScript module that exports an object or array:

### hero.js
```javascript
export const heroData = {
  name: string,
  title: string,
  description: string,
  image: string (path),
  social: { github, linkedin, twitter, email }
}
```

### projects.js
```javascript
export const projectsData = [
  {
    id: number,
    title: string,
    description: string,
    technologies: [string],
    image: string,
    link: string (github),
    live: string (deployed),
    featured: boolean
  }
]
```

### Other data files follow similar patterns
See CUSTOMIZATION.md for detailed examples

---

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server on :5173

# Production
npm run build           # Build optimized site
npm run preview         # Preview production build locally

# Optional
npm run lint            # Check code quality (if configured)
```

---

## 🎨 Component Hierarchy

```
App.jsx
├── Navigation          (Top navigation bar)
├── Hero               (Landing section)
├── About              (About me)
├── LiveCounters       (Statistics)
├── Projects           (Project showcase)
├── Academic           (Education)
├── Certifications     (Certs)
├── Volunteering       (Volunteer work)
├── Contact            (Contact form)
└── Footer             (Footer with links)
```

Each component:
- Gets data from corresponding `src/data/` file
- Uses Framer Motion for animations
- Styled with Tailwind CSS
- Fully responsive

---

## 🎨 Styling System

### Tailwind CSS
- Utility-first CSS framework
- Configure in `tailwind.config.js`
- Used in all components as className attributes

### Colors
```javascript
// tailwind.config.js
primary: "#6366f1"    // Main accent (edit this)
secondary: "#ec4899"  // Secondary accent (edit this)
dark: "#0f172a"       // Dark background
light: "#f8fafc"      // Light text
```

### Typography
```javascript
// tailwind.config.js
fontFamily: {
  sans: ["Inter", "system-ui"]  // Main font
}
```

### Responsive Classes
```css
sm:  @media (min-width: 640px)
md:  @media (min-width: 768px)
lg:  @media (min-width: 1024px)
xl:  @media (min-width: 1280px)
```

---

## 🎬 Animation System

All animations use Framer Motion library

### Common Animation Properties
```javascript
initial={{ opacity: 0 }}     // Starting state
animate={{ opacity: 1 }}     // End state
transition={{ duration: 1 }} // Duration in seconds
whileInView={{}}            // When element comes into view
```

See components for examples

---

## 📦 Dependencies

### Core
- `react` - UI library
- `react-dom` - React rendering

### Styling
- `tailwindcss` - Utility CSS
- `postcss` - CSS processing
- `autoprefixer` - Vendor prefixes

### Animation
- `framer-motion` - Advanced animations

### Build Tools
- `vite` - Build tool (pre-configured)
- `@vitejs/plugin-react` - React plugin for Vite

### Dev Dependencies
- `typescript` - Type checking (optional)
- `eslint` - Code linting (optional)

---

## 🚀 Deployment Checklist

Before deploying:
- [ ] Updated all content in `src/data/`
- [ ] Added images to `public/images/`
- [ ] Set Formspree ID in `contact.js`
- [ ] Tested locally: `npm run dev`
- [ ] Build works: `npm run build`
- [ ] No errors in console
- [ ] Tested on mobile
- [ ] Updated social links
- [ ] CV added to `public/cv.pdf`

Then:
- [ ] Push to GitHub
- [ ] Deploy to Vercel or Netlify
- [ ] Test live deployment
- [ ] Add custom domain (optional)
- [ ] Set up analytics (optional)

See DEPLOYMENT.md for detailed steps

---

## 📚 Documentation Map

| Need | File | Time |
|------|------|------|
| Full overview | README.md | 10 min |
| Quick start | QUICK_REFERENCE.md | 5 min |
| Detailed setup | GETTING_STARTED.md | 15 min |
| Customize content | CUSTOMIZATION.md | 20 min |
| Deploy to web | DEPLOYMENT.md | 10 min |
| Common questions | FAQ.md | 5 min |
| Project structure | INDEX.md (this) | 10 min |

---

## 🔗 Useful Links

### Tools
- Node.js: https://nodejs.org
- VS Code: https://code.visualstudio.com
- GitHub: https://github.com

### Deployment
- Vercel: https://vercel.com
- Netlify: https://netlify.com

### Customization
- Google Fonts: https://fonts.google.com
- Tailwind Colors: https://tailwindcss.com/docs/customizing-colors
- Framer Motion: https://www.framer.com/motion
- Formspree: https://formspree.io

### Documentation
- React: https://react.dev
- Vite: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com

---

## 💡 Pro Tips

1. **Keep data files simple** - Easy to update and maintain
2. **Use existing components** - Don't create duplicate components
3. **Optimize images first** - Use TinyPNG before uploading
4. **Test locally** - Always test before deploying
5. **Version control** - Commit regularly with meaningful messages
6. **Read docs** - Most questions answered in README/CUSTOMIZATION
7. **Use placeholders** - Replace SVGs with real images when ready

---

## 🆘 Troubleshooting Quick Links

- **npm install failing?** → FAQ.md → "Setup & Installation"
- **Images not showing?** → FAQ.md → "Images"
- **Contact form not working?** → FAQ.md → "Contact Form"
- **Deployment failed?** → FAQ.md → "Deployment"
- **How to customize?** → CUSTOMIZATION.md
- **How to deploy?** → DEPLOYMENT.md

---

## 📞 Getting Help

1. **Check FAQ.md** - Most questions answered
2. **Read relevant doc** - CUSTOMIZATION.md, DEPLOYMENT.md, etc.
3. **Check React/Vite docs** - Links in QUICK_REFERENCE.md
4. **Search Stack Overflow** - React, Vite, Tailwind
5. **Ask in React Discord** - Community support

---

## 🎉 You're Ready!

Everything is set up and ready to go. Start by:

1. Reading README.md
2. Running `npm install` (if not done)
3. Running `npm run dev`
4. Editing `src/data/hero.js` with your info
5. Adding your images to `public/images/`
6. Deploying to Vercel!

Happy coding! 🚀
