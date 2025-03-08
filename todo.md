Here's the optimized todo list for implementing the Farcaster Appreciation Frame v2:

**Foundation Setup**
- [x] Create Next.js page with "Daily Appreciation" title and viewport meta tags (Page)
- [x] Implement CSS grid root container with responsive layout (Layout)
- [x] Define AppState TypeScript interface and initial state (Types)
- [x] Set up localStorage sync with 500ms debounced autosave (State)
- [x] Add console logging hook for state changes (Debug)

**Core Input**
- [x] Build vertical flex layout with 3 text inputs (InputComponent)
- [x] Implement animated placeholders and 12-char limits (InputComponent)
- [x] Create input validation state and error handling (InputLogic)
- [x] Add auto-submit when all fields filled (InputLogic)
- [x] Implement viewport height-based keyboard detection (MobileLayout)

**AI Engine**
- [x] Create transformation function with loading spinner (AIGenerator)
- [x] Style output container with gradient and text wrapping (OutputComponent)
- [x] Implement click-to-edit for generated text (OutputComponent)
- [x] Add localStorage history stack (5 entries) (HistoryService)
- [x] Build share text formatter with #Appreciation hashtag (SharingService)

**Actions**
- [x] Create notification toggle with time presets (ActionPanel)
- [x] Implement Neynar API integration for casting (APIService)
- [x] Add channel resolution via Neynar search (APIService)
- [ ] Build cast preview modal with confirmation (ActionPanel)
- [ ] Create notification scheduler with timestamps (Scheduler)

**Mobile**
- [ ] Convert layouts to viewport-unit grids (MobileLayout)
- [ ] Add 48px touch targets and gesture support (MobileComponents)
- [ ] Implement keyboard-aware layout shifting (MobileLayout)

**Assembly**
- [ ] Set up URL search param state serialization (Routing)
- [ ] Add emergency state reset button (DebugComponent)

Total: 20 critical path tasks covering all implementation phases. Completing these in order will result in a fully functional application matching the specification.
