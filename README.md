# Tasks - A Visual To-Do App

A beautifully simple, visually-focused to-do app with bold gradient task bars.

## Features

- **Wide horizontal bars** for each task with vivid gradients
- **4 due date options:**
  - 🔴 **Today** - Red gradient
  - 💗 **Tomorrow** - Magenta gradient  
  - 🔵 **Exact Date** - Blue gradient
  - 🟢 **For Later** - Green gradient
- Tasks persist in browser localStorage
- Smooth animations and hover effects
- Dark theme with modern aesthetics

## Deploy to Vercel

### Option 1: Quick Deploy

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your GitHub repository
5. Click "Deploy" - Vercel auto-detects Next.js

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from this folder
cd todo-app
vercel
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 14
- React 18
- CSS-in-JS (inline styles)
- localStorage for persistence
