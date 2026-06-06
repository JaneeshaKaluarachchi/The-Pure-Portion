# Getting Started with Primefolio

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser - you should see your portfolio!

## 3. Customize Your Portfolio

### Update Hero Section
Edit `src/data/hero.js`:
```javascript
export const heroData = {
  name: "Your Name",
  title: "Your Title",
  // ... rest of config
}
```

### Add Your Projects
Edit `src/data/projects.js` and add your projects to the array:
```javascript
{
  id: 1,
  title: "Project Name",
  description: "...",
  // ... more fields
}
```

### Update About Section
Edit `src/data/about.js` with your bio and highlights.

### Add Images
1. Place images in `public/images/`
2. Reference in data files: `image: "/images/my-image.jpg"`

### Set Up Contact Form

**Option 1: Formspree (Recommended)**
1. Go to https://formspree.io
2. Create an account and new form
3. Copy your form ID
4. Update `src/data/contact.js`:
```javascript
formspreeId: "your_form_id_here"
```

**Option 2: EmailJS**
1. Install: `npm install emailjs-com`
2. Go to https://www.emailjs.com
3. Get your service ID and template ID
4. Update Contact.jsx component

## 4. Add Your CV
1. Place your CV at `public/cv.pdf`
2. Update About component button link

## 5. Deploy to Vercel (1 click!)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/primefolio.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to vercel.com
2. Click "New Project"
3. Select your repository
4. Click "Deploy"
5. Done! 🎉

Your site is live and gets a custom URL. You can add your custom domain in Vercel settings.

## Customization Guide

### Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: "#6366f1",      // Main color (indigo)
  secondary: "#ec4899",    // Accent color (pink)
}
```

### Add More Sections
1. Create new component in `src/components/`
2. Create corresponding data file in `src/data/`
3. Import and add to `App.jsx`

### Change Fonts
Edit `src/index.css` to import different Google Fonts

### Animations
All components use Framer Motion. Adjust animation variants in each component.

## Troubleshooting

### Port already in use
```bash
npm run dev -- --port 3000
```

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Images not showing
- Make sure images are in `public/images/`
- Use path: `/images/filename.jpg` (starts with /)

### Form not working
- Check Formspree ID is correct
- Verify form ID is not `YOUR_FORMSPREE_ID`

## Next Steps

1. ✅ Customize all content
2. ✅ Add your images
3. ✅ Set up contact form
4. ✅ Deploy to Vercel
5. ✅ Add custom domain
6. ✅ Share with the world!

## File Structure Quick Reference

```
primefolio/
├── src/
│   ├── components/      # React components
│   ├── data/           # Content files (EDIT THESE!)
│   ├── assets/         # Imported images
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── images/        # Static images (place here)
│   └── cv.pdf        # Your resume
├── package.json
├── tailwind.config.js # Style config
├── vite.config.js
└── README.md
```

## Support

- Need help? Check README.md
- React docs: https://react.dev
- Tailwind docs: https://tailwindcss.com
- Framer Motion: https://www.framer.com/motion/

Happy coding! 🚀
