/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useState } from "react";
import {
  createWalletClient,
  http,
  encodeFunctionData,
  HttpTransport,
  type Chain,
  type Account,
  type WalletClient,
  type Hex,
  TransactionExecutionError,
  parseUnits,
  createPublicClient,
  formatUnits,
  parseEther,
  custom,
  type Address,
  type Transport,
  type EIP1193Provider
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";
import { sepolia, avalancheFuji, baseSepolia } from "viem/chains";
import {
  SupportedChainId,
  CHAIN_IDS_TO_USDC_ADDRESSES,
  CHAIN_IDS_TO_TOKEN_MESSENGER,
  CHAIN_IDS_TO_MESSAGE_TRANSMITTER,
  DESTINATION_DOMAINS,
} from "@/lib/chains";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params?: any) => void) => void;
      removeListener: (event: string, callback: (params?: any) => void) => void;
    }
  }
}

export type TransferStep =
  | "idle"
  | "approving"
  | "burning"
  | "waiting-attestation"
  | "minting"
  | "completed"
  | "error";

const SUPPORTED_CHAINS = {
  [SupportedChainId.ETH_SEPOLIA]: sepolia,
  [SupportedChainId.AVAX_FUJI]: avalancheFuji,
  [SupportedChainId.BASE_SEPOLIA]: baseSepolia,
} as const;

const RPC_URLS = {
  [SupportedChainId.ETH_SEPOLIA]: [
    "https://sepolia.drpc.org",
    "https://eth-sepolia.g.alchemy.com/v2/demo",
    "https://rpc.sepolia.org",
    "https://rpc2.sepolia.org",
    "https://ethereum-sepolia.publicnode.com",
  ],
  [SupportedChainId.AVAX_FUJI]: [
    "https://avalanche-fuji-c-chain.publicnode.com",
    "https://api.avax-test.network/ext/bc/C/rpc",
    "https://rpc.ankr.com/avalanche_fuji",
  ],
  [SupportedChainId.BASE_SEPOLIA]: [
    "https://sepolia.base.org",
    "https://base-sepolia.g.alchemy.com/v2/demo",
  ],
} as const;

interface DeliveryResponse {
  success: boolean;
  data: {
    txHash: string;
    status: string;
    confirmations: number;
  };
}

export function useCrossChainTransfer() {
  const [currentStep, setCurrentStep] = useState<TransferStep>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const DEFAULT_DECIMALS = 6;

  const addLog = (message: string) =>
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);

  const getPublicClient = (chainId: SupportedChainId) => {
    const urls = RPC_URLS[chainId];
    let currentUrlIndex = 0;

    const transport = http(urls[currentUrlIndex], {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 20_000,
    });

    const client = createPublicClient({
      chain: SUPPORTED_CHAINS[chainId],
      transport,
      batch: {
        multicall: true,
      },
      pollingInterval: 1_000,
    });

    // Wrap methods that need rate limit handling
    const wrappedClient = {
      ...client,
      getBalance: async (params: Parameters<typeof client.getBalance>[0]) => {
        for (let i = 0; i < urls.length; i++) {
          try {
            return await client.getBalance(params);
          } catch (error) {
            if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
              currentUrlIndex = (currentUrlIndex + 1) % urls.length;
              console.log(`Rate limited, trying next RPC: ${urls[currentUrlIndex]}`);
              const newTransport = http(urls[currentUrlIndex], {
                retryCount: 3,
                retryDelay: 1000,
                timeout: 20_000,
              });
              Object.assign(client, createPublicClient({
                chain: SUPPORTED_CHAINS[chainId],
                transport: newTransport,
                batch: {
                  multicall: true,
                },
                pollingInterval: 1_000,
              }));
              continue;
            }
            throw error;
          }
        }
        throw new Error('All RPCs failed');
      }
    };

    return wrappedClient;
  };

  const getBalance = async (address: `0x${string}`, chainId: SupportedChainId) => {
    const publicClient = getPublicClient(chainId);

    const balance = await publicClient.readContract({
      address: CHAIN_IDS_TO_USDC_ADDRESSES[chainId],
      abi: [
        {
          constant: true,
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "balanceOf",
      args: [address],
    });

    const formattedBalance = formatUnits(balance, DEFAULT_DECIMALS);

    return formattedBalance;
  };

  const approveUSDC = async (
    client: WalletClient<HttpTransport, Chain, Account>,
    sourceChainId: number
  ) => {
    setCurrentStep("approving");
    addLog("Approving USDC transfer...");

    try {
      const tx = await client.sendTransaction({
        to: CHAIN_IDS_TO_USDC_ADDRESSES[sourceChainId] as `0x${string}`,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "approve",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ],
          functionName: "approve",
          args: [CHAIN_IDS_TO_TOKEN_MESSENGER[sourceChainId], 10000000000n],
        }),
      });

      addLog(`USDC Approval Tx: ${tx}`);
      return tx;
    } catch (err) {
      setError("Approval failed");
      throw err;
    }
  };

  const burnUSDC = async (
    client: WalletClient,
    sourceChainId: number,
    amount: bigint,
    destinationChainId: number,
    destinationAddress: string,
    transferType: "fast" | "standard"
  ) => {
    setCurrentStep("burning");
    addLog("Burning USDC...");

    try {
      const finalityThreshold = transferType === "fast" ? 1000 : 2000;
      const maxFee = amount - 1n;
      const mintRecipient = `0x${destinationAddress
        .replace(/^0x/, "")
        .padStart(64, "0")}`;

      const tx = await client.sendTransaction({
        account: client.account!,
        chain: SUPPORTED_CHAINS[sourceChainId as SupportedChainId],
        to: CHAIN_IDS_TO_TOKEN_MESSENGER[sourceChainId] as `0x${string}`,
        data: encodeFunctionData({
          abi: [
            {
              type: "function",
              name: "depositForBurn",
              stateMutability: "nonpayable",
              inputs: [
                { name: "amount", type: "uint256" },
                { name: "destinationDomain", type: "uint32" },
                { name: "mintRecipient", type: "bytes32" },
                { name: "burnToken", type: "address" },
                { name: "hookData", type: "bytes32" },
                { name: "maxFee", type: "uint256" },
                { name: "finalityThreshold", type: "uint32" },
              ],
              outputs: [],
            },
          ],
          functionName: "depositForBurn",
          args: [
            amount,
            DESTINATION_DOMAINS[destinationChainId],
            mintRecipient as Hex,
            CHAIN_IDS_TO_USDC_ADDRESSES[sourceChainId],
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            maxFee,
            finalityThreshold,
          ],
        }),
      });

      addLog(`Burn Tx: ${tx}`);
      return tx;
    } catch (err) {
      setError("Burn failed");
      throw err;
    }
  };

  const retrieveAttestation = async (
    transactionHash: string,
    sourceChainId: number
  ) => {
    setCurrentStep("waiting-attestation");
    addLog("Retrieving attestation...");

    const url = `https://iris-api-sandbox.circle.com/v2/messages/${DESTINATION_DOMAINS[sourceChainId]}?transactionHash=${transactionHash}`;

    while (true) {
      try {
        const response = await axios.get(url);
        if (response.data?.messages?.[0]?.status === "complete") {
          addLog("Attestation retrieved!");
          return response.data.messages[0];
        }
        addLog("Waiting for attestation...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        setError("Attestation retrieval failed");
        throw error;
      }
    }
  };

  const switchNetwork = async (chainId: number) => {
    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          const chain = SUPPORTED_CHAINS[chainId as SupportedChainId];
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: [chain.rpcUrls.default.http[0]],
                blockExplorerUrls: [chain.blockExplorers?.default.url],
              },
            ],
          });
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError}`);
        }
      }
      throw switchError;
    }
  };

  const notifyDelivery = async (
    chain: string,
    recipient: string,
    amount: number,
    txHash: string
  ) => {
    try {
      const orderId = `${chain}-${Math.floor(Date.now() / 1000)}`;
      const payload = {
        chain,
        recipient,
        amount,
        orderId
      };
      
      addLog(`Sending delivery notification with payload: ${JSON.stringify(payload, null, 2)}`);
      
      const response = await axios.post<DeliveryResponse>(
        'https://pump-apis.onrender.com/delivery/transfer',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );

      addLog(`Delivery API response: ${JSON.stringify(response.data, null, 2)}`);

      if (response.data.success) {
        addLog(`Delivery notification successful: ${response.data.data.txHash}`);
        return response.data;
      } else {
        const errorMsg = `Delivery notification failed: ${JSON.stringify(response.data)}`;
        addLog(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = `Delivery API error: ${error.message}. ${
          error.response ? `Response: ${JSON.stringify(error.response.data)}` : ''
        }`;
        addLog(errorMessage);
        throw new Error(errorMessage);
      }
      const errorMessage = `Failed to notify delivery: ${error instanceof Error ? error.message : 'Unknown error'}`;
      addLog(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const mintUSDC = async (
    client: WalletClient,
    destinationChainId: number,
    attestation: any,
    amount: string,
    recipient: string
  ) => {
    const MAX_RETRIES = 3;
    let retries = 0;
    setCurrentStep("minting");
    addLog("Minting USDC...");

    while (retries < MAX_RETRIES) {
      try {
        // Switch to destination network first
        addLog(`Switching to network ${destinationChainId}...`);
        await switchNetwork(destinationChainId);
        addLog("Network switched successfully");

        const publicClient = getPublicClient(destinationChainId);
        const feeData = await publicClient.estimateFeesPerGas();
        const contractConfig = {
          address: CHAIN_IDS_TO_MESSAGE_TRANSMITTER[
            destinationChainId
          ] as `0x${string}`,
          abi: [
            {
              type: "function",
              name: "receiveMessage",
              stateMutability: "nonpayable",
              inputs: [
                { name: "message", type: "bytes" },
                { name: "attestation", type: "bytes" },
              ],
              outputs: [],
            },
          ] as const,
        };

        // Log attestation data for debugging
        addLog(`Message: ${attestation.message}`);
        addLog(`Attestation: ${attestation.attestation}`);

        // Estimate gas with buffer
        const gasEstimate = await publicClient.estimateContractGas({
          ...contractConfig,
          functionName: "receiveMessage",
          args: [attestation.message, attestation.attestation],
          account: client.account,
        });

        // Add 50% buffer to gas estimate
        const gasWithBuffer = (gasEstimate * 150n) / 100n;
        addLog(`Gas Used: ${formatUnits(gasWithBuffer, 9)} Gwei`);
        addLog(`Max Fee: ${formatUnits(feeData.maxFeePerGas || 0n, 9)} Gwei`);
        addLog(`Priority Fee: ${formatUnits(feeData.maxPriorityFeePerGas || 0n, 9)} Gwei`);

        const tx = await client.sendTransaction({
          account: client.account!,
          chain: SUPPORTED_CHAINS[destinationChainId as SupportedChainId],
          to: contractConfig.address,
          data: encodeFunctionData({
            ...contractConfig,
            functionName: "receiveMessage",
            args: [attestation.message, attestation.attestation],
          }),
          gas: gasWithBuffer,
          maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas * 2n : undefined,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * 2n : undefined,
        });

        addLog(`Mint Tx: ${tx}`);

        // Notify delivery after successful mint
        const chainName = Object.entries(SupportedChainId).find(
          ([_, value]) => value === destinationChainId
        )?.[0] || '';
        
        await notifyDelivery(
          chainName,
          recipient,
          parseFloat(amount),
          tx
        );

        setCurrentStep("completed");
        break;
      } catch (err) {
        if (err instanceof TransactionExecutionError && retries < MAX_RETRIES) {
          retries++;
          addLog(`Error details: ${err.message}`);
          addLog(`Retry ${retries}/${MAX_RETRIES}...`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
          continue;
        }
        setError(`Mint failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        throw err;
      }
    }
  };

  const executeTransfer = async (
    address: `0x${string}`,
    sourceChainId: number,
    destinationChainId: number,
    amount: string,
    transferType: "fast" | "standard",
    // @ts-ignore
    walletClient: WalletClient<Transport, Chain, Account>
  ) => {
    try {
      // @ts-ignore
      const addresses = await walletClient.getAddresses();
      if (!addresses[0]) throw new Error("No account found");

      const account = addresses[0] as Address;
      const numericAmount = parseUnits(amount, DEFAULT_DECIMALS);
      const defaultDestination = address;

      const checkNativeBalance = async (chainId: SupportedChainId) => {
        const publicClient = getPublicClient(chainId);
        const balance = await publicClient.getBalance({
          address: defaultDestination,
        });
        return balance;
      };

      setCurrentStep("approving");
      addLog("Approving USDC transfer...");

      try {
        const sourceChain = SUPPORTED_CHAINS[sourceChainId as SupportedChainId];
        const approveClient = createWalletClient({
          account,
          chain: sourceChain,
          transport: custom(window.ethereum!)
        });

        const tx = await approveClient.sendTransaction({
          account,
          chain: sourceChain,
          to: CHAIN_IDS_TO_USDC_ADDRESSES[sourceChainId] as `0x${string}`,
          data: encodeFunctionData({
            abi: [{
              type: "function",
              name: "approve",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            }],
            functionName: "approve",
            args: [CHAIN_IDS_TO_TOKEN_MESSENGER[sourceChainId], 10000000000n],
          }),
        });

        addLog(`USDC Approval Tx: ${tx}`);
      } catch (err) {
        console.error('Approval error:', err);
        setError("Approval failed");
        throw err;
      }
      
      setCurrentStep("burning");
      const sourceChain = SUPPORTED_CHAINS[sourceChainId as SupportedChainId];
      const burnClient = createWalletClient({
        account,
        chain: sourceChain,
        transport: custom(window.ethereum!)
      });
      const burnTx = await burnUSDC(
        burnClient,
        sourceChainId,
        numericAmount,
        destinationChainId,
        defaultDestination,
        transferType
      );

      setCurrentStep("waiting-attestation");
      const attestation = await retrieveAttestation(burnTx, sourceChainId);
      
      const minBalance = parseEther("0.01");
      const balance = await checkNativeBalance(destinationChainId as SupportedChainId);
      if (balance < minBalance) {
        throw new Error("Insufficient native token for gas fees");
      }

      setCurrentStep("minting");
      const destinationChain = SUPPORTED_CHAINS[destinationChainId as SupportedChainId];
      const mintClient = createWalletClient({
        account,
        chain: destinationChain,
        transport: custom(window.ethereum!)
      });
      await mintUSDC(
        mintClient,
        destinationChainId,
        attestation,
        amount,
        defaultDestination
      );
      
      setCurrentStep("completed");
    } catch (error) {
      setCurrentStep("error");
      addLog(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const reset = () => {
    setCurrentStep("idle");
    setLogs([]);
    setError(null);
  };

  return {
    currentStep,
    logs,
    error,
    executeTransfer,
    getBalance,
    reset,
  };
}
