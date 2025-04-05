"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";

export function ConnectWalletButton() {
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  // State to track client-side mounting
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Render default button until component has mounted on client
  if (!hasMounted) {
    return (
      <Button disabled>Loading...</Button>
    );
  }

  // After mounting, render based on actual connection status
  if (isConnected) {
    return (
      <div className="flex items-center justify-between w-full">
        <p className="text-sm truncate mr-4">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>Disconnect</Button>
      </div>
    );
  }

  // Default: Render connect button if not connected (and mounted)
  return (
    <Button onClick={() => connect({ connector: injected() })}>
      Connect Wallet
    </Button>
  );
} 