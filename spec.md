```markdown
# Appreciation Frame v2 Specification

## 1. OVERVIEW

### Core Functionality
- **Three-Word Input Interface**: Mobile-optimized text entry fields for simultaneous word input
- **AI-Powered Appreciation Generation**: Instant transformation of input words into gratitude statements
- **Daily Notification System**: Client-side scheduled reminders for appreciation practice
- **Channel Casting**: One-click sharing to Farcaster appreciation channel using default settings

### UX Flow
1. Landing Frame: Triple input field layout with animated placeholder hints
2. Generation Screen: Auto-display transformed appreciation statements using inline processing
3. Action Panel: Dual CTAs for notification setup and channel casting
4. Confirmation View: Visual feedback for cast success + reminder status indicator

## 2. TECHNICAL REQUIREMENTS

### Core Stack
- Responsive CSS Grid/Flexbox layouts
- Client-side state management via localStorage
- Neynar API v2 for cast publishing/search
- Frame v2 SDK for native interactions

### Critical APIs
- Neynar Cast Search: `channel_id` filtering for appreciation channel verification
- Neynar Notification: Basic subscription management
- Frame v2 Storage: Device-specific persistence layer

## 3. FRAMES v2 IMPLEMENTATION

### Canvas Features
- Dynamic text wrapping for variable-length appreciation statements
- Gradient overlays for visual hierarchy
- Touch-friendly control clustering

### Input Handling
- Triple independent text fields with character limits
- Auto-submit on third field completion
- Dynamic keyboard management for mobile IMEs

### Sharing System
- Direct cast embedding via Frame SDK
- Channel ID pre-configuration with override capability
- Cast preview generation before publishing

## 4. MOBILE CONSIDERATIONS

### Layout Strategy
- Vertical stacking for inputs on <500px viewports
- Viewport unit scaling for typography
- Conditional hamburger menu for desktop fallback

### Touch Optimization
- 48px minimum touch targets
- Virtual keyboard-aware layout shifting
- Hold-to-edit gestures on generated statements

## 5. CONSTRAINTS COMPLIANCE

### Storage Model
- Per-device localStorage for:
  - User-generated appreciation history
  - Notification preferences
  - Draft autosaves

### Channel Integration
- Default channel resolution via Neynar search:
  ```neynar
  /v2/farcaster/cast/search?channel_id=appreciation&q=is:channel
  ```
- Fallback to Farcaster-wide search if channel missing

### Notification Workflow
- Client-side scheduler using localStorage timestamps
- Frame-to-Frame navigation for reminder handling
- No server-side cron jobs or background processes

### Complexity Limits
- No user authentication layer
- Ephemeral data storage only
- Plaintext logging for debugging
- No multi-channel casting
- Single-language support (English-only)
```