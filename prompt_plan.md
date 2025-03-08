# Farcaster Appreciation Frame v2 Implementation Prompts

## Phase 1: Foundation Setup
```text
Create a Next.js page component with Frame v2 scaffolding:
- Use existing template layout but customize title to "Daily Appreciation"
- Implement responsive container with CSS grid root layout
- Add Frame SDK initialization with meta tags for mobile viewport
- Set up TypeScript types for AppState: {words: string[], appreciation?: string, notificationTime?: number}
- Initialize localStorage integration with draft autosave every 500ms
- Add plaintext console logging hook
```

## Phase 2: Core Input Interface
```text
Build the triple word input component:
- Create 3 text input fields in vertical mobile-first flex layout
- Add animated placeholders: ["Mindful", "Joyful", "Grateful"] using CSS keyframes
- Implement character limits (12 max per field) with length counters
- Add input validation state using useState hooks
- Wire inputs to AppState.words with debounced localStorage sync
- Create auto-submit effect when all 3 fields filled
- Add mobile virtual keyboard detection via viewport height check
```

## Phase 3: AI Transformation Engine
```text
Implement appreciation statement generation:
- Create transformation function: (words: string[]) => string
- Add inline loading animation during generation
- Style output container with gradient overlay and dynamic text wrapping
- Implement click-to-edit functionality for generated text
- Add localStorage history stack (last 5 generations)
- Create shareable text format including #Appreciation hashtag
- Connect generation trigger to input completion
```

## Phase 4: Action System Integration
```text
Build the action panel component with:
- Notification toggle button with time picker (3 preset options)
- Cast to channel button with Neynar API integration
- Implement channel_id resolution using Neynar search API
- Add cast preview modal with confirmation
- Create notification scheduler using localStorage timestamps
- Add status indicators for cast/notification states
- Wire error handling for API failures
```

## Phase 5: Mobile Optimization Pass
```text
Enhance mobile experience by:
- Converting flex layouts to viewport-unit based grids
- Adding 48px touch targets for action buttons
- Implementing keyboard-aware layout shifting
- Adding touch gesture for history swipe
- Optimizing CSS transitions for mobile GPUs
- Adding draft autosave recovery on mount
- Testing viewport scaling from 320px-768px
```

## Phase 6: Final Assembly
```text
Integrate all components with state flow:
1. LandingFrame (input)
2. GenerationView (AI output) 
3. ActionPanel (cast/notify)
4. ConfirmationFrame (status)

Add frame-to-frame navigation logic:
- Use URL search params for state serialization
- Implement back/forward handling
- Add loading states between transitions
- Connect localStorage to initial state hydration
- Finalize responsive breakpoints
- Add emergency state reset button
```

# Implementation Notes

1. **No Auth Required** - Uses device-specific localStorage
2. **Channel Fallback** - Uses Neynar API search as specified
3. **Ephemeral Data** - All storage is client-side only
4. **Error Boundaries** - Critical for mobile stability
5. **Frame v2 Features** - Full CSS control enables complex layouts

Each prompt builds on previous state management and UI components, ensuring incremental complexity. The final assembly phase wires up completed pieces without introducing new concepts.