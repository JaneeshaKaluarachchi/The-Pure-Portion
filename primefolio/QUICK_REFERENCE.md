# Primefolio - Quick Reference

## 🚀 After Installation

### 1. Start Development Server
```bash
npm run dev
```
Open http://localhost:5173

### 2. Edit Your Portfolio

#### Content Files (Edit These!)
```
src/data/
├── hero.js          ← Your name, title, social links
├── about.js         ← Bio, highlights
├── projects.js      ← Your projects
├── academics.js     ← Education
├── certifications.js ← Certifications
├── volunteering.js  ← Volunteer work
├── stats.js         ← Live counters
└── contact.js       ← Contact info & Formspree ID
```

#### Add Your Images
Place in `public/images/`:
- `hero.jpg` or `.png` or `.svg`
- `about.jpg`
- `project1.jpg`
- etc.

Update paths in data files:
```javascript
image: "/images/your-image.jpg"
```

### 3. Customize Styling

#### Colors (tailwind.config.js)
```javascript
primary: "#6366f1",      // Indigo
secondary: "#ec4899",    // Pink
```

Change to your brand colors!

#### Dark Mode
Already configured. To disable, edit `index.html` and remove `class="bg-dark"`.

### 4. Set Up Contact Form

#### Get Formspree ID
1. Go to https://formspree.io
2. Create free account
3. Create new form
4. Copy the form ID
5. Paste in `src/data/contact.js`:
```javascript
formspreeId: "f1234567"  // Replace with your ID
```

#### Test Form
Visit your portfolio, fill out contact form, check your email inbox.

### 5. Deploy to Vercel (2 minutes)

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOU/primefolio.git
git push -u origin main

# 2. Go to vercel.com
# 3. Click "New Project"
# 4. Select your repo
# 5. Click "Deploy"
# Done! Your site is LIVE 🎉
```

---

## 📁 File Structure

```
primefolio/
├── src/
│   ├── components/      ← React components (pre-built)
│   ├── data/           ← EDIT: Your content
│   ├── assets/         ← Imported images
│   ├── App.jsx         ← Main component
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── images/         ← PLACE: Your images here
│   ├── cv.pdf         ← Your resume
│   └── hero.svg       ← Placeholder (replace)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json
```

---

## 🛠️ Common Tasks

### Update Hero Section
**File**: `src/data/hero.js`
```javascript
{
  name: "Your Name",           // Your name
  title: "Your Title",         // Your professional title
  subtitle: "...",
  description: "...",
  social: {
    github: "https://github.com/yourprofile",
    linkedin: "https://linkedin.com/in/yourprofile",
    twitter: "https://twitter.com/yourprofile",
    email: "your@email.com"
  }
}
```

### Add a Project
**File**: `src/data/projects.js`
```javascript
{
  id: 7,
  title: "Your Project",
  description: "What it does",
  image: "/images/project-name.jpg",
  technologies: ["React", "Node.js"],
  link: "https://github.com/...",
  live: "https://deployed-url.com",
  featured: true  // Show on main page
}
```

### Add Education
**File**: `src/data/academics.js`
```javascript
{
  id: 3,
  degree: "Bachelor of Science",
  field: "Computer Science",
  institution: "University Name",
  year: "2020 - 2024",
  gpa: "3.9/4.0",
  highlights: ["Web Dev", "AI"]
}
```

### Add Certification
**File**: `src/data/certifications.js`
```javascript
{
  id: 5,
  title: "AWS Certified",
  issuer: "Amazon",
  date: "2024",
  credentialId: "ID-12345",
  link: "https://credential-url.com"
}
```

---

## 🎨 Styling Tips

### Dark Theme Enabled
The site uses a dark theme by default. All colors are in:
- `tailwind.config.js` - Color definitions
- `src/components/*.jsx` - Component styling with Tailwind classes

### Add Custom CSS
Edit `src/index.css` and add your rules:
```css
/* Custom styles */
body {
  font-family: 'Your Font', sans-serif;
}
```

### Change Animations
All components use Framer Motion. Edit motion props:
```javascript
// In any component
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 1 }}
```

---

## 🚢 Deployment Checklist

Before deploying, ensure:

✅ Updated all content in `src/data/`  
✅ Added your images to `public/images/`  
✅ Set Formspree ID for contact form  
✅ Tested locally: `npm run dev`  
✅ Build works: `npm run build` (no errors)  
✅ Updated social links  
✅ Changed colors if desired  
✅ Added CV to `public/cv.pdf`  

---

## 🔗 Useful Links

- **Local Dev**: http://localhost:5173
- **Vercel**: https://vercel.com
- **Formspree**: https://formspree.io
- **Tailwind Colors**: https://tailwindcss.com/docs/customizing-colors
- **Framer Motion**: https://www.framer.com/motion
- **React Docs**: https://react.dev

---

## 🐛 Troubleshooting

### Dev Server Won't Start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Build Fails
```bash
npm run build
# Check for errors, fix, then retry
```

### Images Not Showing
- Ensure file is in `public/images/`
- Use correct path: `/images/filename.jpg`
- Check file extension matches

### Contact Form Not Working
- Verify Formspree ID is set
- Check it's not `YOUR_FORMSPREE_ID`
- Test with real email

### Vercel Deployment Failed
- Check build output for errors
- Ensure `npm run build` works locally
- Verify all dependencies are installed

---

## 💡 Pro Tips

1. **Use SVG for graphics** - Smaller file size, scales perfectly
2. **Optimize images** - Use [TinyPNG](https://tinypng.com) for JPGs
3. **Use relative URLs** - Always use `/images/` not `./images/`
4. **Keep sections simple** - Easy to maintain and update
5. **Test on mobile** - Chrome DevTools device simulation

---

## 📞 Need Help?

1. Check the full [README.md](./README.md)
2. See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment options
3. See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed setup
4. Check component code for implementation details

---

Built with ❤️ using React, Tailwind CSS & Framer Motion  
Deploy anywhere. No backend needed. ⚡
