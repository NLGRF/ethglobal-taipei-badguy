"use client";

import React, { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia, arbitrumSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const config = createConfig({
  chains: [sepolia, arbitrumSepolia],
  transports: {
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
} 