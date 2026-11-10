# Primegram Development Setup Guide

## Quick Start Setup

### Option 1: Automatic Setup (Recommended)
1. Double-click `setup-dev.bat` file
2. Follow the prompts
3. Open browser to `http://localhost:5173`

### Option 2: Manual Setup
1. **Install Node.js**:
   - Go to https://nodejs.org
   - Download and install Node.js (version 20 or higher)
   - Restart your terminal/command prompt

2. **Install Dependencies**:
   ```bash
   cd c:\Users\omeri\Downloads\liquid-prime
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   - Open browser to `http://localhost:5173`
   - All Primegram features will be available

## Environment Variables Required

Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

## Features Available

Once running, you'll have access to:

### Movie Hub
- Browse trending, top-rated, and upcoming movies
- Search movies with TMDB API
- Save movies to local library
- Watch trailers in-app

### Music Hub
- Full YouTube video playback
- Save tracks to library
- AI-powered recommendations
- Mini-player with controls

### AI Assistant
- Press 'P' key to activate
- Voice and text input
- 3D glowing orb animation
- Siri-style interface

### WebRTC Calling
- Peer-to-peer video calls
- Incoming call notifications
- Real-time video/audio streaming

### Stories & Reels
- Full-screen immersive viewer
- Auto-advancing progress bars
- Tap-to-pause/play functionality
- 24-hour auto-deletion

### Smart Feed
- Auto-play videos on scroll
- Viewport detection
- Muted playback by default

## Troubleshooting

If you encounter issues:

1. **Node.js not found**: Install Node.js from nodejs.org
2. **Port already in use**: The server will automatically use next available port
3. **Dependencies fail**: Try `npm install --force`
4. **API errors**: Check environment variables in `.env` file

## Development Notes

- All data is stored locally using IndexedDB
- No external dependencies required for core functionality
- Dark theme maintained throughout
- Responsive design for all screen sizes
