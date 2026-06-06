# Deployment Guide for Primefolio

## Quick Deployment Options

### 1. **Vercel (Recommended - 1 minute) ⭐**

**Best for**: Fastest setup, free tier with unlimited bandwidth

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/primefolio.git
git push -u origin main
```

#### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select your GitHub repository
4. Click **"Deploy"**
5. Wait for deployment to complete
6. Your site is **LIVE** 🎉

#### Step 3: Add Custom Domain (Optional)
1. In Vercel dashboard, go to project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records with your registrar

**Cost**: Free for unlimited projects  
**Performance**: Excellent (Global CDN)  
**Time**: 2-3 minutes

---

### 2. **Netlify (Alternative)**

**Best for**: Easy setup with form integration, generous free tier

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/primefolio.git
git push -u origin main
```

#### Step 2: Deploy on Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click **"New site from Git"**
3. Select your GitHub repository
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **"Deploy site"**

#### Step 3: Enable Form Handling (If using contact form)
1. In Netlify dashboard, go to **Settings > Forms**
2. Add your form to the Contact component (already configured)
3. Test your form

**Cost**: Free for unlimited sites  
**Performance**: Excellent (Global CDN)  
**Time**: 2-3 minutes

---

### 3. **GitHub Pages (Budget Option)**

**Best for**: Hosting on GitHub, zero cost

#### Setup:
1. Update `vite.config.js`:
```javascript
export default {
  base: '/primefolio/',  // Replace with your repo name
  ...
}
```

2. Update `package.json` scripts:
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist",
  ...
}
```

3. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages in repository settings

**Cost**: Free  
**Performance**: Good  
**Time**: 5 minutes

---

## Environment Variables

### For Formspree Contact Form

1. Create `.env.local`:
```
VITE_FORMSPREE_ID=your_form_id_from_formspree
```

2. Update `Contact.jsx` to use the env variable

3. Deploy with your environment variables set in the platform dashboard

---

## Pre-Deployment Checklist

✅ Update all content in `src/data/` files  
✅ Add your images to `public/images/`  
✅ Set up contact form (Formspree ID)  
✅ Test locally: `npm run dev`  
✅ Build successfully: `npm run build`  
✅ Update links in components (GitHub, LinkedIn, etc.)  
✅ Add custom domain (optional)  
✅ Set up analytics (optional)  

---

## Performance Optimization

After deployment, check your score:

- **Lighthouse Score**: Target 90+
- **Page Load**: Target < 2 seconds
- **Bundle Size**: Should be ~50KB gzipped

To verify:
1. Inspect page with Chrome DevTools
2. Run Lighthouse audit
3. Check Core Web Vitals

---

## Domain Setup (After Deployment)

### Update DNS Records

For Vercel:
```
A Record:      76.76.19.132
AAAA Record:   2603:1030:f::1
CNAME Record:  cname.vercel-dns.com
```

For Netlify:
```
A Record: 75.2.60.5
```

Steps:
1. Log into your domain registrar
2. Find DNS settings
3. Add the records provided by your platform
4. Wait for propagation (5-30 minutes)
5. Verify domain is connected

---

## Monitoring & Analytics

### Add Google Analytics

1. Create account at [google.com/analytics](https://google.com/analytics)
2. Get tracking ID
3. Add to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

---

## Troubleshooting Deployment

### Build Failed
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Images Not Showing
- Check images are in `public/images/`
- Use correct path: `/images/filename.jpg`
- Verify file extensions are correct

### Contact Form Not Working
- Verify Formspree ID in `contact.js`
- Check it's not `YOUR_FORMSPREE_ID`
- Test with real email address

### Slow Load Times
- Check bundle size: `npm run build`
- Optimize images (< 100KB each)
- Enable compression on your host
- Use CDN (included in Vercel/Netlify)

---

## Summary

| Platform | Setup Time | Cost | Performance | Recommendation |
|----------|-----------|------|-------------|-----------------|
| **Vercel** | 2 min | Free | Excellent | ⭐ Best Choice |
| **Netlify** | 2 min | Free | Excellent | Great Alternative |
| **GitHub Pages** | 5 min | Free | Good | Budget Option |

**Recommended Path**:
1. Develop locally
2. Push to GitHub
3. Deploy on Vercel (1 click)
4. Add custom domain
5. Share with world 🌍

---

Need help? Check out:
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Vite Docs](https://vitejs.dev)
