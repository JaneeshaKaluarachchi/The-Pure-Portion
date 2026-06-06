# Customization Guide

## Complete Guide to Personalizing Your Portfolio

### Section 1: Basic Information

#### Hero Section
**File**: `src/data/hero.js`

```javascript
export const heroData = {
  name: "Your Name",                    // Your name
  title: "Your Professional Title",    // e.g., "Full Stack Developer"
  subtitle: "Your tagline",           // Short catch phrase
  description: "Your elevator pitch", // 1-2 sentences
  cta: {
    primary: "View My Work",          // Primary button text
    secondary: "Get In Touch"         // Secondary button text
  },
  image: "/images/hero.jpg",
  social: {
    github: "https://github.com/yourprofile",
    linkedin: "https://linkedin.com/in/yourprofile",
    twitter: "https://twitter.com/yourprofile",
    email: "your@email.com"
  }
}
```

#### About Section
**File**: `src/data/about.js`

Update your bio, highlights, and image:
```javascript
{
  title: "About Me",
  description: "Short description",
  highlights: [
    "Your skill 1",
    "Your skill 2",
    "Your skill 3"
  ],
  bio: "Your full bio paragraph...",
  image: "/images/about.jpg"
}
```

---

### Section 2: Projects

**File**: `src/data/projects.js`

Each project should have:
```javascript
{
  id: 1,
  title: "Project Name",
  description: "What the project does",
  image: "/images/project.jpg",
  technologies: ["React", "Node.js", "MongoDB"],
  link: "https://github.com/yourrepo/project",    // GitHub link
  live: "https://deployed-project.com",          // Live demo
  featured: true  // true for main gallery, false for others
}
```

**Tips**:
- Use 3-4 featured projects
- Include relevant tech stack
- Provide working demo links
- Good quality screenshots/images

---

### Section 3: Education & Qualifications

#### Education
**File**: `src/data/academics.js`

```javascript
{
  id: 1,
  degree: "Bachelor of Science",
  field: "Computer Science",
  institution: "University Name",
  year: "2020 - 2024",
  gpa: "3.9/4.0",
  highlights: ["Relevant coursework", "Awards"]
}
```

#### Certifications
**File**: `src/data/certifications.js`

```javascript
{
  id: 1,
  title: "AWS Certified Solutions Architect",
  issuer: "Amazon Web Services",
  date: "2024",
  credentialId: "CRED-12345",
  link: "https://verify-credential-link.com"
}
```

---

### Section 4: Experience

#### Volunteering & Community
**File**: `src/data/volunteering.js`

```javascript
{
  id: 1,
  organization: "Organization Name",
  role: "Your Role",
  description: "What you did",
  period: "2023 - Present",
  impact: "Measurable outcome or contribution"
}
```

#### Stats/Live Counters
**File**: `src/data/stats.js`

```javascript
{
  id: 1,
  label: "Projects Completed",
  value: 25,        // The number to count to
  suffix: "+"       // Add after number
}
```

---

### Section 5: Contact Information

**File**: `src/data/contact.js`

```javascript
export const contactData = {
  title: "Get In Touch",
  description: "Have a question? Let's talk!",
  email: "your@email.com",
  phone: "+1 (555) 123-4567",
  location: "City, State",
  formspreeId: "f1234567",  // From formspree.io
  social: {
    github: "https://github.com/yourprofile",
    linkedin: "https://linkedin.com/in/yourprofile",
    twitter: "https://twitter.com/yourprofile",
    instagram: "https://instagram.com/yourprofile"
  }
}
```

---

## Design Customization

### Colors

**File**: `tailwind.config.js`

```javascript
theme: {
  extend: {
    colors: {
      primary: "#6366f1",      // Main accent color (currently indigo)
      secondary: "#ec4899",    // Secondary accent (currently pink)
      dark: "#0f172a",         // Dark background
      light: "#f8fafc",        // Light text
    },
  },
},
```

**Color Ideas**:
- Blue Professional: `primary: "#3b82f6"`
- Tech Blue: `primary: "#0ea5e9"`
- Purple Creative: `primary: "#a855f7"`
- Green Growth: `primary: "#10b981"`
- Red Energy: `primary: "#ef4444"`

**Common Combos**:
```javascript
// Professional Blue
primary: "#2563eb",
secondary: "#1e40af"

// Modern Purple
primary: "#7c3aed",
secondary: "#6d28d9"

// Tech Cyan
primary: "#06b6d4",
secondary: "#0891b2"
```

### Typography

**File**: `tailwind.config.js` or `src/index.css`

Add Google Fonts:
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
```

Update config:
```javascript
fontFamily: {
  sans: ["Inter", "system-ui"],
  serif: ["Playfair Display", "serif"]
}
```

### Animations

All components use Framer Motion. Adjust animations in component files.

**Example**: Make hero section slower
```javascript
// In Hero.jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 2 }}  // Slower (was 0.8)
>
```

---

## Image Management

### Recommended Image Sizes

- **Hero**: 1200x600px
- **Projects**: 600x400px  
- **About**: 600x400px
- **Profile**: 400x400px (optional)

### Image Format

- Use **WebP** for best compression
- Fallback to **JPG** for compatibility
- Use **SVG** for graphics/icons
- Use **PNG** for transparency

### Optimization Tools

1. [TinyPNG](https://tinypng.com) - Compress JPG/PNG
2. [Squoosh](https://squoosh.app) - Convert formats
3. [SVG Optimizer](https://jakearchibald.github.io/svgomg/) - Optimize SVGs

### Placeholder Images

Replace sample SVG files with your own:
```
public/images/
├── hero.jpg         ← Your hero image
├── about.jpg        ← Your photo
├── project1.jpg     ← Project screenshot
├── project2.jpg
├── project3.jpg
└── ...
```

---

## Navigation & Links

### Update Social Links

In each data file, update URLs:

```javascript
github: "https://github.com/YOUR-USERNAME",
linkedin: "https://linkedin.com/in/YOUR-PROFILE",
twitter: "https://twitter.com/YOUR-HANDLE",
email: "your.email@gmail.com"
```

### CV/Resume

1. Update `public/cv.pdf` with your resume
2. The download button automatically uses this file
3. Test the link locally before deploying

---

## Content Tips

### Writing Good Project Descriptions
```
❌ Bad: "Built a project with React"
✅ Good: "E-commerce platform with real-time inventory, 
         payment processing, and admin dashboard"
```

### Tech Stack Selection
```
❌ Bad: "JavaScript, CSS, HTML"
✅ Good: "React, Node.js, MongoDB, TailwindCSS"
(Include versions if impressive: "React 18", "Node.js 18+")
```

### Impact Statements
```
❌ "Helped with a project"
✅ "Led team of 3 developers, launched in 2 weeks, 
    serving 5,000+ users"
```

---

## Advanced Customization

### Add New Sections

1. Create component: `src/components/NewSection.jsx`
2. Create data: `src/data/newsection.js`
3. Import in `App.jsx` and add to render

### Custom Styling

Add to `src/index.css`:
```css
/* Custom animations */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-in {
  animation: slideIn 0.5s ease-out;
}
```

### Custom Fonts

Import in `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@400;700&display=swap');
```

Then use in `tailwind.config.js`:
```javascript
fontFamily: {
  sans: ["YourFont", "system-ui"]
}
```

---

## SEO Optimization

### Update Meta Tags

Edit `index.html`:
```html
<meta name="description" content="Your professional summary" />
<meta name="keywords" content="your, skills, tech" />
<meta property="og:title" content="Your Name - Developer" />
<meta property="og:description" content="Your summary" />
```

### Add Structured Data

In `index.html` head:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Your Name",
  "url": "https://yoursite.com",
  "jobTitle": "Full Stack Developer",
  "sameAs": [
    "https://github.com/yourprofile",
    "https://linkedin.com/in/yourprofile"
  ]
}
</script>
```

---

## Performance Optimization

### Image Optimization

1. Use TinyPNG to compress
2. Use WebP format for smaller size
3. Include height/width attributes
4. Use lazy loading for below-fold images

### Code Splitting

Already included with Vite. No additional config needed.

### Caching

Already configured in Vercel/Netlify deployment.

---

## Testing Your Changes

### Local Testing
```bash
npm run dev
# Visit http://localhost:5173
# Test on mobile: Chrome DevTools → Device Toolbar
```

### Build Testing
```bash
npm run build
npm run preview
# Test production build
```

### Checklist Before Deploy
- [ ] All data updated
- [ ] Images optimized and placed
- [ ] Contact form tested
- [ ] Social links working
- [ ] Mobile responsive
- [ ] Build succeeds without errors
- [ ] Local preview works

---

## Need Help?

- **Colors**: Check TailwindCSS color palette
- **Fonts**: Browse Google Fonts
- **Icons**: Use emoji or simple Unicode
- **Animation**: See Framer Motion docs
- **React**: Visit React documentation

---

Happy customizing! 🎨
