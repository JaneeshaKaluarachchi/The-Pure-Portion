# Primefolio - Static Portfolio

A fully static, high-performance portfolio built with modern technologies. No backend needed. Deploy anywhere in seconds.

## 🚀 Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel / Netlify
- **Contact Form**: Formspree / EmailJS

## ✨ Features

- ⚡ **Blazing Fast** - Static site optimization with Vite
- 🎨 **Modern Design** - Beautiful, responsive UI with Tailwind CSS
- 🎬 **Smooth Animations** - Engaging interactions with Framer Motion
- 📱 **Fully Responsive** - Works perfectly on all devices
- 📊 **Live Counters** - Animated statistics that count up
- 🔍 **SEO Ready** - Optimized for search engines
- 🔐 **No Backend** - Pure frontend, zero server costs
- 🚢 **Easy Deployment** - Deploy to Vercel in one click

## 📋 Sections

- **Hero** - Eye-catching landing section
- **About** - Personal introduction and highlights
- **Live Counters** - Animated statistics
- **Projects** - Featured and other projects showcase
- **Education** - Academic qualifications
- **Certifications** - Professional certifications
- **Volunteering** - Community involvement
- **Contact** - Contact form (via Formspree)
- **Footer** - Navigation and social links

## 📁 Project Structure

```
src/
  ├── components/          # React components
  │   ├── Navigation.jsx
  │   ├── Hero.jsx
  │   ├── About.jsx
  │   ├── LiveCounters.jsx
  │   ├── Projects.jsx
  │   ├── Academic.jsx
  │   ├── Certifications.jsx
  │   ├── Volunteering.jsx
  │   ├── Contact.jsx
  │   └── Footer.jsx
  ├── data/               # Static content data
  │   ├── hero.js
  │   ├── about.js
  │   ├── projects.js
  │   ├── academics.js
  │   ├── certifications.js
  │   ├── volunteering.js
  │   ├── stats.js
  │   └── contact.js
  ├── assets/            # Images (imported)
  ├── App.jsx
  ├── main.jsx
  └── index.css
public/
  ├── images/            # Static images
  │   ├── hero.jpg
  │   ├── about.jpg
  │   └── project*.jpg
  └── cv.pdf            # Resume PDF
```

## 🛠️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd primefolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

4. **Build for production**
   ```bash
   npm run build
   ```

## ✏️ Customization

### Update Your Content

All content is stored in local data files in `src/data/`. Edit these files to update your portfolio:

- `hero.js` - Hero section, name, title, social links
- `about.js` - About section, bio, highlights
- `projects.js` - Your projects showcase
- `academics.js` - Education details
- `certifications.js` - Your certifications
- `volunteering.js` - Volunteer work
- `stats.js` - Live counter statistics
- `contact.js` - Contact information and form setup

### Add Images

Place your images in `public/images/` folder. Update references in data files:

```javascript
image: "/images/your-image.jpg"
```

### Set Up Contact Form

1. Go to [Formspree.io](https://formspree.io)
2. Create a new form and get your form ID
3. Update the `formspreeId` in `src/data/contact.js`

Alternative options:
- **EmailJS** - For email integration
- **Netlify Forms** - If hosting on Netlify

### Customize Styling

- **Colors**: Edit `tailwind.config.js` to change primary/secondary colors
- **Fonts**: Modify font imports in `index.css`
- **Theme**: Adjust Tailwind classes in components

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project" → Select your repository
4. Click "Deploy"

That's it! Your site is live.

### Deploy to Netlify

1. Push code to GitHub
2. Visit [netlify.com](https://netlify.com)
3. Click "New site from Git" → Select repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click "Deploy"

### Deploy to GitHub Pages

1. Update `vite.config.js`:
   ```javascript
   export default {
     base: '/your-repo-name/',
     ...
   }
   ```

2. Add to `package.json` scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. Run: `npm run deploy`

## 🌐 Custom Domain

After deploying to Vercel/Netlify:

1. Go to your domain registrar
2. Update DNS to point to Vercel/Netlify
3. Configure custom domain in project settings

## 📊 Performance

- **Lighthouse Score**: 95+ (typical)
- **Page Load Time**: < 1 second
- **Bundle Size**: ~50KB (gzipped)

## 🔒 Best Practices

✅ All content in version control  
✅ No sensitive data in code  
✅ SEO optimized  
✅ Mobile-first responsive design  
✅ Accessibility compliant  
✅ Fast page load times  
✅ Easy to maintain and update  

## 📝 License

MIT License - Feel free to use this template for your portfolio

## 🤝 Contributing

Have improvements? Feel free to submit a pull request!

## 📞 Support

- Check the [documentation](https://vitejs.dev)
- Review [Tailwind CSS docs](https://tailwindcss.com)
- See [Framer Motion docs](https://www.framer.com/motion/)

---

Built with ❤️ using React, Tailwind CSS & Framer Motion
