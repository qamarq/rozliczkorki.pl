import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppRouter } from "@repo/api";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { onlineManager, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
import * as Network from "expo-network";
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

export const queryClient = new QueryClient({
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
