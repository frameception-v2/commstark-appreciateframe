"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, {
  AddFrame,
  SignIn as SignInCore,
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
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${PROJECT_ID}-state`);
      return saved ? JSON.parse(saved) : initialAppState;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 w-full max-w-6xl mx-auto">
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
                className="rounded-lg border p-3 text-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Start typing..."
                maxLength={12}
                value={appState.words[0] || ''}
                onChange={(e) => setAppState(prev => {
                  const newState = {
                    ...prev,
                    words: [e.target.value, prev.words[1], prev.words[2]]
                  };
                  console.log('Word 1 updated:', newState.words[0]);
                  return newState;
                })}
              />
              <div className="text-sm text-neutral-500">
                {12 - (appState.words[0]?.length || 0)} characters remaining
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="word2">Joyful Thought</Label>
              <input
                id="word2"
                className="rounded-lg border p-3 text-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Start typing..."
                maxLength={12}
                value={appState.words[1] || ''}
                onChange={(e) => setAppState(prev => {
                  const newState = {
                    ...prev,
                    words: [prev.words[0], e.target.value, prev.words[2]]
                  };
                  console.log('Word 2 updated:', newState.words[1]);
                  return newState;
                })}
              />
              <div className="text-sm text-neutral-500">
                {12 - (appState.words[1]?.length || 0)} characters remaining
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="word3">Grateful For</Label>
              <input
                id="word3"
                className="rounded-lg border p-3 text-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Start typing..."
                maxLength={12}
                value={appState.words[2] || ''}
                onChange={(e) => setAppState(prev => {
                  const newState = {
                    ...prev,
                    words: [prev.words[0], prev.words[1], e.target.value]
                  };
                  console.log('Word 3 updated:', newState.words[2]);
                  return newState;
                })}
              />
              <div className="text-sm text-neutral-500">
                {12 - (appState.words[2]?.length || 0)} characters remaining
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
