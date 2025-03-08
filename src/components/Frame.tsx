"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  type FrameContext,
} from "@farcaster/frame-sdk";

type AppState = {
  words: string[];
  appreciation?: string;
  notificationTime?: number;
  history: string[];
};

// Notification time presets in milliseconds since midnight
const NOTIFICATION_PRESETS = [
  9 * 60 * 60 * 1000,   // 9:00 AM
  12 * 60 * 60 * 1000,  // 12:00 PM
  18 * 60 * 60 * 1000,  // 6:00 PM
];

import { useState } from "react";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { http } from "viem";
import { base } from "wagmi/chains";
import { truncateAddress } from "~/lib/truncateAddress";
import { createStore } from "mipd";
import { NEYNAR_API_KEY } from "~/lib/constants";
import { Label } from "~/components/ui/label";
import { PROJECT_ID, PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

const initialAppState: AppState = {
  words: [],
  history: [],
};

export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const [inputErrors, setInputErrors] = useState<{word1?: string; word2?: string; word3?: string}>({});
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  const validateInput = (words: string[]) => {
    const errors: typeof inputErrors = {};
    if (words[0] && words[0].length > 12) errors.word1 = "Mindful moment too long";
    if (words[1] && words[1].length > 12) errors.word2 = "Joyful thought too long"; 
    if (words[2] && words[2].length > 12) errors.word3 = "Gratitude expression too long";
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [shareStatus, setShareStatus] = useState("");
  const [txHash, setTxHash] = useState<string>("");
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`${PROJECT_ID}-state`);
        return saved ? JSON.parse(saved) : initialAppState;
      } catch (error) {
        console.error('Error loading state from localStorage:', error);
        return initialAppState;
      }
    }
    return initialAppState;
  });

  // Debounced autosave to localStorage with logging
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('Autosaving state:', appState);
      localStorage.setItem(`${PROJECT_ID}-state`, JSON.stringify(appState));
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [appState]);

  // Detect mobile keyboard via viewport height
  useEffect(() => {
    const handleViewportChange = () => {
      const isKeyboardActive = window.visualViewport?.height < window.innerHeight * 0.8;
      setIsKeyboardOpen(!!isKeyboardActive);
    };

    // Use visualViewport API if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
    };
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareFeedback, setShowShareFeedback] = useState(false);

  const handleNotificationToggle = useCallback((time: number) => {
    setAppState(prev => ({
      ...prev,
      notificationTime: prev.notificationTime === time ? undefined : time
    }));
  }, []);

  const handleShare = useCallback(async (text: string) => {
    try {
      // First find the channel ID for "appreciation"
      const searchResponse = await fetch(
        `https://api.neynar.com/v2/farcaster/channel/search?q=appreciation`,
        {
          headers: {
            'api_key': NEYNAR_API_KEY
          }
        }
      );
      
      if (!searchResponse.ok) throw new Error('Channel search failed');
      const searchData = await searchResponse.json();
      
      const channel = searchData.channels.find((c: any) => 
        c.name.toLowerCase() === 'appreciation'
      );
      if (!channel) throw new Error('Appreciation channel not found');
      
      // Now create the cast
      const castResponse = await fetch(
        'https://api.neynar.com/v2/farcaster/cast',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_key': NEYNAR_API_KEY
          },
          body: JSON.stringify({
            text: text,
            channel_id: channel.id
          })
        }
      );

      if (!castResponse.ok) throw new Error('Cast failed');
      setShowShareFeedback(true);
      setShareStatus('');
      setTimeout(() => setShowShareFeedback(false), 3000);
    } catch (error) {
      console.error('Sharing failed:', error);
      setShareStatus(error instanceof Error ? error.message : 'Sharing failed');
      setTimeout(() => setShareStatus(''), 3000);
    }
  }, []);
  
  // Simple transformation function with loading state
  const transformWords = useCallback(async (words: string[]) => {
    setIsLoading(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Basic transformation with random variations and consistent hashtag
      const appreciations = [
        `Embracing ${words[0]} moments, finding joy in ${words[1]}, and grateful for ${words[2]}.`,
        `Mindful of ${words[0]}, joyful about ${words[1]}, thankful for ${words[2]}.`,
        `${words[0]} → ${words[1]} → ${words[2]} - today's gratitude journey.`
      ].map(text => `${text} #DailyAppreciation`);
      
      const newAppreciation = appreciations[Math.floor(Math.random() * appreciations.length)];
      setAppState(prev => ({
        ...prev,
        appreciation: newAppreciation,
        history: [newAppreciation, ...prev.history].slice(0, 5) // Keep last 5 entries
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-submit when all fields are valid
  useEffect(() => {
    if (appState.words.length === 3 && 
        appState.words.every(word => word && word.length > 0 && word.length <= 12) &&
        Object.keys(inputErrors).length === 0) {
      console.log('All fields filled - submitting...');
      transformWords(appState.words);
    }
  }, [appState.words, inputErrors]);

  const [added, setAdded] = useState(false);

  const [addFrameResult, setAddFrameResult] = useState("");

  const addFrame = useCallback(async () => {
    try {
      await sdk.actions.addFrame();
    } catch (error) {
      if (error instanceof Error) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      if (!context) {
        return;
      }

      setContext(context);
      setAdded(context.client.added);

      // If frame isn't already added, prompt user to add it
      if (!context.client.added) {
        addFrame();
      }

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setAdded(true);
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        console.log("frameAddRejected", reason);
      });

      sdk.on("frameRemoved", () => {
        console.log("frameRemoved");
        setAdded(false);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        console.log("notificationsEnabled", notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        console.log("notificationsDisabled");
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded, addFrame]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 w-full max-w-6xl mx-auto ${
        isKeyboardOpen ? 'pb-[40vh]' : '' // Add padding when keyboard is open
      }`}>
        <div className="md:col-span-2">
          <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-center">{PROJECT_TITLE}</CardTitle>
            <CardDescription className="text-center">
              {PROJECT_DESCRIPTION}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="word1">Mindful Moment</Label>
              <input
                id="word1"
                className={`rounded-lg border p-3 text-lg focus:ring-2 focus:ring-purple-500 ${
                  inputErrors.word1 ? 'border-red-500 focus:ring-red-200' : 
                  appState.words[0]?.length === 12 ? 'border-green-500' : ''
                }`}
                maxLength={12}
                value={appState.words[0] || ''}
                onChange={(e) => setAppState(prev => {
                  const newWords = [e.target.value, prev.words[1], prev.words[2]];
                  validateInput(newWords);
                  return {
                    ...prev,
                    words: newWords
                  };
                })}
              />
              <div className={`text-sm ${
                inputErrors.word1 ? 'text-red-600' : 'text-neutral-500'
              }`}>
                {inputErrors.word1 && (
                  <div className="mb-1 font-medium">{inputErrors.word1}</div>
                )}
                <span>{12 - (appState.words[0]?.length || 0)} characters remaining</span>
                <div className="relative h-8 mt-1">
                  <span className="absolute opacity-0 animate-placeholder">Mindful</span>
                  <span className="absolute opacity-0 animate-placeholder delay-1000">Present</span>
                  <span className="absolute opacity-0 animate-placeholder delay-2000">Calm</span>
                </div>
              </div>
              <style>{`
                @keyframes placeholder-pulse {
                  0%, 100% { opacity: 0; }
                  50% { opacity: 1; }
                }
                .animate-placeholder {
                  animation: placeholder-pulse 3s infinite;
                }
                .delay-1000 {
                  animation-delay: 1s;
                }
                .delay-2000 {
                  animation-delay: 2s;
                }
                
                @keyframes gradient-spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .animate-gradient-spin {
                  animation: gradient-spin 20s linear infinite;
                }
              `}</style>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="word2">Joyful Thought</Label>
              <input
                id="word2"
                className={`rounded-lg border p-3 text-lg focus:ring-2 focus:ring-purple-500 ${
                  inputErrors.word2 ? 'border-red-500 focus:ring-red-200' : 
                  appState.words[1]?.length === 12 ? 'border-green-500' : ''
                }`}
                maxLength={12}
                value={appState.words[1] || ''}
                onChange={(e) => setAppState(prev => {
                  const newWords = [prev.words[0], e.target.value, prev.words[2]];
                  validateInput(newWords);
                  return {
                    ...prev,
                    words: newWords
                  };
                })}
              />
              <div className={`text-sm ${
                inputErrors.word2 ? 'text-red-600' : 'text-neutral-500'
              }`}>
                {inputErrors.word2 && (
                  <div className="mb-1 font-medium">{inputErrors.word2}</div>
                )}
                <span>{12 - (appState.words[1]?.length || 0)} characters remaining</span>
                <div className="relative h-8 mt-1">
                  <span className="absolute opacity-0 animate-placeholder">Joyful</span>
                  <span className="absolute opacity-0 animate-placeholder delay-1000">Happy</span>
                  <span className="absolute opacity-0 animate-placeholder delay-2000">Smiling</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="word3">Grateful For</Label>
              <input
                id="word3"
                className={`rounded-lg border p-3 text-lg focus:ring-2 focus:ring-purple-500 ${
                  inputErrors.word3 ? 'border-red-500 focus:ring-red-200' : 
                  appState.words[2]?.length === 12 ? 'border-green-500' : ''
                }`}
                maxLength={12}
                value={appState.words[2] || ''}
                onChange={(e) => setAppState(prev => {
                  const newWords = [prev.words[0], prev.words[1], e.target.value];
                  validateInput(newWords);
                  return {
                    ...prev,
                    words: newWords
                  };
                })}
              />
              <div className={`text-sm ${
                inputErrors.word3 ? 'text-red-600' : 'text-neutral-500'
              }`}>
                {inputErrors.word3 && (
                  <div className="mb-1 font-medium">{inputErrors.word3}</div>
                )}
                <span>{12 - (appState.words[2]?.length || 0)} characters remaining</span>
                <div className="relative h-8 mt-1">
                  <span className="absolute opacity-0 animate-placeholder">Grateful</span>
                  <span className="absolute opacity-0 animate-placeholder delay-1000">Thankful</span>
                  <span className="absolute opacity-0 animate-placeholder delay-2000">Blessed</span>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            )}

            {appState.appreciation && !isLoading && (
              <div className="mt-6 p-6 bg-gradient-to-br from-purple-100/80 via-blue-50 to-pink-100/80 rounded-xl relative shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute inset-0 bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-purple-200/20 via-transparent to-blue-200/20 animate-gradient-spin" />
                {isEditing ? (
                  <textarea
                    className="relative z-10 text-xl leading-relaxed text-purple-900 break-words hyphens-auto overflow-wrap-anywhere w-full bg-transparent border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
                    style={{textShadow: '0 2px 4px rgba(245, 243, 255, 0.5)'}}
                    value={appState.appreciation}
                    onChange={(e) => setAppState(prev => ({
                      ...prev,
                      appreciation: e.target.value
                    }))}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="relative z-10 text-xl leading-relaxed text-purple-900 break-words hyphens-auto overflow-wrap-anywhere cursor-text"
                    style={{textShadow: '0 2px 4px rgba(245, 243, 255, 0.5)'}}
                    onClick={() => setIsEditing(true)}
                  >
                    {appState.appreciation}
                  </div>
                )}
                <button
                  onClick={() => handleShare(appState.appreciation!)}
                  className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Share Appreciation
                </button>

                <div className="mt-4 border-t border-purple-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-900">Daily Reminder</span>
                    <span className="text-sm text-purple-600">
                      {appState.notificationTime ? 
                        new Date(appState.notificationTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) :
                        'Not set'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {NOTIFICATION_PRESETS.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleNotificationToggle(time)}
                        className={`text-sm py-2 rounded-lg transition-colors ${
                          appState.notificationTime === time ?
                          'bg-purple-600 text-white' :
                          'bg-purple-100 text-purple-900 hover:bg-purple-200'
                        }`}
                      >
                        {new Date(time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </button>
                    ))}
                  </div>
                </div>
                {showShareFeedback && (
                  <div className="text-center text-green-600 text-sm mt-2">
                    Shared to Farcaster!
                  </div>
                )}
              </div>
            )}

            {appState.history.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-purple-900">Recent History</h3>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {appState.history.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 text-sm bg-white/50 backdrop-blur-sm rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-50/50 transition-colors"
                      onClick={() => setAppState(prev => ({
                        ...prev,
                        appreciation: item
                      }))}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
