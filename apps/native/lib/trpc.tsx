import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppRouter } from "@repo/api";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import * as Network from "expo-network";
import * as SecureStore from "expo-secure-store";
import superjson from "superjson";
import { useState } from "react";
import { authClient } from "./auth-client";

export const trpc = createTRPCReact<AppRouter>();

const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function isOnline(state: Network.NetworkState) {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) =>
    setOnline(isOnline(state)),
  );
  Network.getNetworkStateAsync()
    .then((state) => setOnline(isOnline(state)))
    .catch(() => undefined);
  return () => subscription.remove();
});

const SESSION_KEYS = ["rozliczkorki_cookie", "rozliczkorki_session_data"];

function isUnauthorized(error: unknown) {
  const code = (error as { data?: { code?: string } })?.data?.code;
  return code === "UNAUTHORIZED";
}

let signingOut = false;

function onQueryError(error: unknown) {
  if (!isUnauthorized(error) || signingOut) return;
  void signOutCompletely();
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onQueryError }),
  mutationCache: new MutationCache({ onError: onQueryError }),
  defaultOptions: {
    queries: { gcTime: CACHE_MAX_AGE },
    mutations: { networkMode: "always" },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "rozliczkorki-query-cache",
  serialize: superjson.stringify,
  deserialize: superjson.parse,
});

export async function clearOfflineCache() {
  queryClient.clear();
  await persister.removeClient();
}

export async function signOutCompletely() {
  if (signingOut) return;
  signingOut = true;
  try {
    await authClient.signOut().catch(() => undefined);
    await Promise.all(
      SESSION_KEYS.map((key) => SecureStore.deleteItemAsync(key).catch(() => undefined)),
    );
    await clearOfflineCache();
    await authClient.getSession().catch(() => undefined);
  } finally {
    signingOut = false;
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.EXPO_PUBLIC_API_URL}/api/trpc`,
          transformer: superjson,
          async headers() {
            return { cookie: await authClient.getCookie() };
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: CACHE_MAX_AGE,
          buster: String(
            Constants.expoConfig?.android?.versionCode ??
              Constants.expoConfig?.ios?.buildNumber ??
              Constants.expoConfig?.version ??
              "0",
          ),
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}
