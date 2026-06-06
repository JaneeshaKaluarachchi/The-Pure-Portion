# Primefolio - FAQ & Troubleshooting

## Frequently Asked Questions

### Setup & Installation

**Q: How do I get started after cloning?**
A: 
```bash
npm install
npm run dev
```
Then visit http://localhost:5173

**Q: npm install is taking forever, is it stuck?**
A: No, this is normal on first install. It can take 2-5 minutes depending on your internet. Let it finish.

**Q: I got an error during npm install. What do I do?**
A:
```bash
# Clear npm cache
npm cache clean --force

# Delete lock file and node_modules
rm -rf node_modules package-lock.json

# Try again
npm install
```

**Q: Do I need Node.js installed?**
A: Yes. Download from https://nodejs.org (version 16 or higher)

---

### Development

**Q: How do I preview my changes?**
A: Run `npm run dev` and refresh your browser at http://localhost:5173

**Q: Can I work offline?**
A: Yes, once installed. Just run `npm run dev`

**Q: How do I change the site title?**
A: Edit the `<title>` tag in `index.html`

**Q: How do I add a new section?**
A:
1. Create component: `src/components/NewSection.jsx`
2. Create data: `src/data/newsection.js`
3. Import in `App.jsx` and add to render

**Q: How do I disable a section?**
A: Remove the component import and usage from `App.jsx`

---

### Customization

**Q: How do I change colors?**
A: Edit `tailwind.config.js`:
```javascript
colors: {
  primary: "#your-color",
  secondary: "#your-color",
}
```

**Q: Can I use my own font?**
A: Yes! Import from Google Fonts in `src/index.css` and update `tailwind.config.js`

**Q: How do I add more projects?**
A: Add entries to `src/data/projects.js` array

**Q: Can I hide sections I don't need?**
A: Yes, remove the component from `App.jsx`

**Q: How do I update my content?**
A: Edit files in `src/data/` folder - changes appear instantly in dev mode

---

### Images

**Q: Where should I put my images?**
A: In `public/images/` folder

**Q: What image formats work?**
A: JPG, PNG, SVG, WebP (JPG/PNG are most compatible)

**Q: What size should images be?**
A: Hero: 1200x600px, Projects: 600x400px, Avatar: 400x400px

**Q: How do I reference images in code?**
A: Use `/images/filename.jpg` (starts with `/`)

**Q: My images aren't showing. Why?**
A:
1. Check file is in `public/images/`
2. Check path uses leading `/`
3. Check file extension matches
4. Check file exists and isn't corrupted

**Q: How do I optimize images?**
A: Use TinyPNG.com to compress before uploading

---

### Contact Form

**Q: How do I set up the contact form?**
A:
1. Go to https://formspree.io
2. Sign up free
3. Create new form
4. Copy your form ID
5. Paste in `src/data/contact.js`: `formspreeId: "f1234567"`

**Q: Contact form isn't working. What's wrong?**
A:
1. Verify Formspree ID is set correctly
2. Check it's not `YOUR_FORMSPREE_ID`
3. Test by submitting a message
4. Check your email spam folder

**Q: I want to use a different form service?**
A: You can use EmailJS or Netlify Forms. Update the `Contact.jsx` component accordingly.

**Q: Can I add custom fields to the form?**
A: Yes, edit the form fields in `Contact.jsx` and add corresponding form handling

---

### Performance

**Q: Is my site fast?**
A: Yes! Built with Vite for optimal performance. Check with Lighthouse audit.

**Q: How can I improve performance?**
A:
1. Optimize images (< 100KB each)
2. Use WebP format
3. Minimize external scripts
4. Use CDN for large assets (already included on Vercel)

**Q: Why is the site slow locally?**
A: Development mode loads everything unbundled. Production build (`npm run build`) is much faster.

---

### Deployment

**Q: Which platform should I use?**
A: Vercel (recommended) - 1-click deployment, fastest setup

**Q: How do I deploy to Vercel?**
A:
1. Push code to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Select your repo
5. Click "Deploy"

**Q: How do I deploy to Netlify?**
A:
1. Push code to GitHub
2. Go to netlify.com
3. Click "New site from Git"
4. Select your repo
5. Build command: `npm run build`
6. Publish: `dist`

**Q: Can I use my custom domain?**
A: Yes! After deploying, add it in platform settings

**Q: How do I add HTTPS?**
A: Automatic on Vercel/Netlify

**Q: My deployment failed. Why?**
A:
1. Check build succeeds locally: `npm run build`
2. Check all dependencies are listed in `package.json`
3. Check for environment variables needed
4. View deployment logs for error details

**Q: Can I preview before deploying?**
A: Yes, run `npm run build && npm run preview` locally

---

### GitHub

**Q: How do I push to GitHub?**
A:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/primefolio.git
git push -u origin main
```

**Q: How do I update after changes?**
A:
```bash
git add .
git commit -m "Update portfolio"
git push
```

**Q: What should I in .gitignore?**
A: Already configured. Don't commit `node_modules/` or `.env` files

---

### Browser Compatibility

**Q: Does it work in all browsers?**
A: Yes, works in Chrome, Firefox, Safari, Edge (modern versions)

**Q: Mobile responsive?**
A: Yes, fully responsive from mobile to desktop

**Q: I see layout issues on mobile. What's wrong?**
A: Clear browser cache and refresh. Check Chrome DevTools responsive mode.

---

### SEO

**Q: Will my site show up in Google?**
A: Yes, it's fully SEO optimized. Takes 2-4 weeks for indexing.

**Q: How do I improve SEO?**
A:
1. Add good meta tags in `index.html`
2. Use descriptive project titles
3. Add alt text to images
4. Create good content
5. Get backlinks

**Q: How do I submit to Google?**
A:
1. Go to Google Search Console
2. Add your site
3. Submit sitemap (auto-generated by Vercel)

---

### Advanced Questions

**Q: Can I add a backend?**
A: Yes, but not needed! This is fully static. If you need a backend, deploy separately to Heroku, Railway, etc.

**Q: Can I add a database?**
A: Yes, but data will be static. Consider Firebase or Supabase if you need dynamic content.

**Q: Can I add e-commerce?**
A: Yes, integrate Stripe/PayPal in Contact or separate page

**Q: Can I add authentication?**
A: Yes, use Auth0, Firebase Auth, or similar

**Q: Can I add a blog?**
A: Yes, create a Blog component and add posts to data files

---

## Common Errors & Solutions

### Error: "Cannot find module"
```
Solution: npm install
```

### Error: "Port 5173 already in use"
```bash
# Use different port
npm run dev -- --port 3000
```

### Error: "Module not found" in build
```bash
# Check all imports are correct
# Verify file paths
# Run: npm run build
```

### Error: "Your branch is ahead by X commits"
```bash
# If working with git
git push origin main
```

### Error: "Environment variable not found"
```bash
# Create .env file
# Add: VITE_YOUR_VAR=value
```

### Error: "Cannot read property of undefined"
```
Solution: Check data files have correct structure
```

---

## Getting Help

### Resources
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Framer Motion Docs](https://www.framer.com/motion)

### Community
- React Discord: https://discord.gg/react
- Stack Overflow: https://stackoverflow.com/questions/tagged/react
- GitHub Discussions: Create issue in your repo

### Documentation in This Project
- `README.md` - Full documentation
- `QUICK_REFERENCE.md` - Quick setup
- `GETTING_STARTED.md` - Detailed guide
- `DEPLOYMENT.md` - Deployment options
- `CUSTOMIZATION.md` - Customization guide

---

## Tips & Tricks

### Fast Development
- Hot reload works automatically
- Save files and refresh browser
- Check browser console for errors (F12)

### Testing
- Test locally before deploying
- Test on mobile: Chrome DevTools → Device Toolbar
- Test form with test email before deploying

### Version Control
- Commit often with meaningful messages
- Keep .gitignore updated
- Don't commit `node_modules/` or `.env`

### Performance
- Use `npm run build` to check bundle size
- Optimize images before uploading
- Use WebP format when possible

### Backup
- Keep a backup of your data files
- Use GitHub as backup
- Export JSON regularly

---

## Still Need Help?

1. Check the documentation files
2. Search StackOverflow
3. Read React/Vite/Tailwind docs
4. Create a GitHub issue
5. Ask in React community Discord

Happy coding! 🚀
