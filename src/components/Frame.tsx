"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  type Context,
} from "@farcaster/frame-sdk";

type AppState = {
  words: string[];
  appreciation?: string;
  notificationTime?: number;
};

const initialAppState: AppState = {
  words: [],
};
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";
import { PROJECT_ID, PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";


export default function Frame() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
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

  // Auto-submit when all fields are valid
  useEffect(() => {
    if (appState.words.length === 3 && 
        appState.words.every(word => word && word.length > 0 && word.length <= 12) &&
        Object.keys(inputErrors).length === 0) {
      console.log('All fields filled - submitting...');
      // TODO: Implement AI transformation
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
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
