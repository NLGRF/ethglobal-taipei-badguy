// @ts-nocheck
"use client";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params?: any) => void) => void;
      removeListener: (event: string, callback: (params?: any) => void) => void;
    }
  }
}

import { useEffect, useState } from 'react';
import { useCrossChainTransfer } from '@/hooks/use-cross-chain-transfer';
import { createPublicClient, http, formatUnits, WalletClient, createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { SupportedChainId, SUPPORTED_CHAINS, CHAIN_TO_CHAIN_NAME } from '@/lib/chains';
import { ProgressSteps } from '@/components/progress-step';
import { TransferLog } from '@/components/transfer-log';
import { Timer } from '@/components/timer';
import { TransferTypeSelector } from '@/components/transfer-type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import axios from 'axios';

interface GasPrice {
  chain: string;
  symbol: string;
  price: number;
  gasAmount: number;
  usdcPrice: number;
  minimumRequired: number;
  cannotSend: boolean;
}

interface GasCost {
  success: boolean;
  data: {
    gasAmount: string;
    gasPriceInEther: string;
    maxFeeInEther: string;
    priorityFeeInEther: string;
    totalCostLegacy: string;
    totalCostEIP1559Min: string;
    totalCostEIP1559Max: string;
  };
}

// USDC Token addresses (testnet)
const USDC_ADDRESS: { [key: string]: `0x${string}` } = {
  "0xaa36a7": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" // Sepolia USDC
};

// USDC ABI for balanceOf with proxy
const USDC_ABI = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
] as const;

export default function Home() {
  // Buy Gas States
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [chainId, setChainId] = useState('');
  const [chainName, setChainName] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [usdcAmount, setUsdcAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gasPrices, setGasPrices] = useState<GasPrice[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [gasCost, setGasCost] = useState<GasCost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [selectedGasOption, setSelectedGasOption] = useState<GasPrice | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Add new state for showing transfer section
  const [showTransfer, setShowTransfer] = useState(false);

  // Transfer States
  const { currentStep, logs, error: transferError, executeTransfer: startTransfer, getBalance, reset: resetTransferState } = useCrossChainTransfer();
  const [sourceChain, setSourceChain] = useState<SupportedChainId>(SupportedChainId.ETH_SEPOLIA);
  const [destinationChain, setDestinationChain] = useState<SupportedChainId>(SupportedChainId.BASE_SEPOLIA);
  const [amount, setAmount] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showFinalTime, setShowFinalTime] = useState(false);
  const [transferType, setTransferType] = useState<'fast' | 'standard'>('fast');
  const [balance, setBalance] = useState('0');

  // Add new state for transfer type
  const [isCrossChainTransfer, setIsCrossChainTransfer] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState('');

  // Add new state for wallet client
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  // Buy Gas Functions
  const getChainName = (chainId: string) => {
    console.log('Getting chain name for:', chainId);
    
    const chains: { [key: string]: string } = {
      // Chain IDs
      "43113": "Ethereum Sepolia",
      "84532": "Base Sepolia",
      "0xaa36a7": "Ethereum Sepolia",
      "0x14a34": "Base Sepolia",
      // Chain Names
      "Ethereum": "Ethereum Sepolia",
      "Base": "Base Sepolia",
      "Polygon": "Polygon Amoy",
      "Celo": "Celo",
      "Rootstock": "Rootstock Testnet"
    };
    
    console.log('Available chains:', chains);
    const chainName = chains[chainId] || chainId.replace('0x', '');
    console.log('Found chain name:', chainName);
    return chainName;
  };

  const handleConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask');
        return;
      }

      // If already connected, disconnect
      if (isWalletConnected) {
        setWalletAddress('');
        setChainId('');
        setChainName('');
        setEthBalance('0');
        setUsdcBalance('0');
        setIsWalletConnected(false);
        setWalletClient(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Create wallet client
      const client = createWalletClient({
        transport: custom(window.ethereum)
      });
      setWalletClient(client);

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      setWalletAddress(account);
      setChainId(chainId);
      setChainName(getChainName(chainId));
      setIsWalletConnected(true);

      // Get ETH balance
      const provider = createPublicClient({
        chain: sepolia,
        transport: http()
      });
      
      const balance = await provider.getBalance({ address: account as `0x${string}` });
      setEthBalance(formatUnits(balance, 18));

      // Get USDC balance if on supported chain
      if (USDC_ADDRESS[chainId]) {
        try {
          const usdcBalance = await provider.readContract({
            address: USDC_ADDRESS[chainId],
            abi: USDC_ABI,
            functionName: 'balanceOf',
            args: [account]
          });

          console.log('USDC Balance raw:', usdcBalance);
          
          // Use fixed decimals for USDC (6)
          setUsdcBalance(formatUnits(usdcBalance, 6));
        } catch (err) {
          console.error('Error reading USDC balance:', err);
          setError('Failed to read USDC balance');
        }
      }

    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAmount = async () => {
    if (!usdcAmount || !isWalletConnected) return;
    
    try {
      const response = await axios.get(`https://ethglobal-taipei-badguy.onrender.com/price?amount=${usdcAmount}`);
      const apiGasPrices = response.data.map((item: any) => ({
        chain: getChainName(item.chain),
        symbol: item.gasName,
        price: item.price,
        gasAmount: item.gasAmount,
        usdcPrice: item.usdcPrice,
        minimumRequired: 0.00,
        cannotSend: chainName === getChainName(item.chain) // Disable if same chain
      }));

      setGasPrices(apiGasPrices);
    } catch (err) {
      console.error('Error fetching gas prices:', err);
      setError('Failed to fetch gas prices');
    }
  };

  const handleBuyGas = async () => {
    if (!selectedGasOption || !isWalletConnected || !receiverAddress) return;
    if (!window.ethereum) {
      setError('Please install MetaMask');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      // Get source chain ID from current connected wallet
      const sourceChainNum = parseInt(chainId, 16);
      
      // Get destination chain ID from selected gas option
      let destinationChainNum;
      switch (selectedGasOption.chain) {
        case "Ethereum Sepolia":
          destinationChainNum = SupportedChainId.ETH_SEPOLIA;
          break;
        case "Base Sepolia":
          destinationChainNum = SupportedChainId.BASE_SEPOLIA;
          break;
        // Add other chains as needed
      }

      // Check if it's cross-chain or same chain transfer
      const isCrossChain = sourceChainNum !== destinationChainNum;
      setIsCrossChainTransfer(isCrossChain);

      if (isCrossChain) {
        // Set source and destination chains for cross-chain transfer
        setSourceChain(sourceChainNum);
        if (destinationChainNum) {
          setDestinationChain(destinationChainNum);
        }
      }

      // Set amount and receiver address for both types of transfer
      setAmount(usdcAmount);
      setDestinationAddress(receiverAddress);

      // Show transfer section
      setShowTransfer(true);

      // Scroll to transfer section
      document.querySelector('.border-t')?.scrollIntoView({ behavior: 'smooth' });

      setIsSuccess(true);

    } catch (err) {
      console.error('Error buying gas:', err);
      setError('Failed to buy gas');
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  // Reset function to also hide transfer section
  const handleReset = () => {
    resetTransferState();
    setIsTransferring(false);
    setShowFinalTime(false);
    setElapsedSeconds(0);
    setShowTransfer(false); // Hide transfer section on reset
  };

  // Add effect to watch currentStep
  useEffect(() => {
    if (currentStep === 'completed') {
      setShowFinalTime(true);
      setIsTransferring(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!walletAddress || !walletClient) return;

    const wrapper = async () => {
      try {
        const balance = await getBalance(walletAddress as `0x${string}`, sourceChain);
      setBalance(balance);
      } catch (err) {
        console.error('Error fetching balance:', err);
    }
    };

    const newDestinationChain = SUPPORTED_CHAINS.find((chainId) => chainId !== sourceChain);

    if (newDestinationChain) {
      setDestinationChain(newDestinationChain);
    }

    wrapper();
  }, [sourceChain, showFinalTime, walletAddress, walletClient]);

  // Update the transfer button click handler
  const handleStartTransfer = async () => {
    if (!amount || !walletClient) return;
    
    try {
      setIsTransferring(true);
      const [account] = await walletClient.getAddresses();
      
      startTransfer(
        account,
        Number(sourceChain),
        Number(destinationChain),
        amount,
        transferType,
        walletClient
      );
    } catch (err) {
      console.error('Error starting transfer:', err);
      setError('Failed to start transfer');
      setIsTransferring(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Buy Gas Section */}
      <div className="flex flex-col gap-8 p-8">
        <div className="flex items-center gap-2">
          <Image 
            src="/badguy.png" 
            alt="Badguy Icon" 
            width={24} 
            height={24}
          />
          <h1 className="text-3xl font-bold">Cross-Chain Gas Station by Bad Guy ⛽</h1>
        </div>
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Purchase Configuration</h2>
              <Button 
                onClick={handleConnectWallet}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                {isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
              </Button>
            </div>

            {isWalletConnected && (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-900">Connected to wallet</span>
                    <span className="ml-auto text-gray-500">{walletAddress}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Chain ID:</span>
                    <span className="text-gray-500">{chainId}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">Network:</span>
                    <span className="text-gray-500">{chainName}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">ETH Balance:</span>
                    <span className="text-gray-500">{ethBalance} ETH</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900">USDC Balance:</span>
                    <span className="text-gray-500">{usdcBalance} USDC</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">USDC Amount</Label>
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      value={usdcAmount}
                      onChange={(e) => setUsdcAmount(e.target.value)}
                      placeholder="Enter USDC amount"
                      min="0"
                      step="any"
                      className="flex-1 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                    />
                    <Button
                      onClick={handleConfirmAmount}
                      disabled={!usdcAmount || isLoading}
                      className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                    >
                      Confirm
                    </Button>
                  </div>
                </div>

                {gasPrices.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Available Gas Options</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {gasPrices.map((option, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border cursor-pointer ${
                            option.cannotSend 
                              ? 'border-gray-200 bg-gray-50'
                              : selectedGasOption?.chain === option.chain
                              ? 'border-green-500 bg-green-50'
                              : 'border-green-500/20 hover:border-green-500/40'
                          }`}
                          onClick={() => !option.cannotSend && setSelectedGasOption(option)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{option.chain}</h3>
                            <span className="text-sm text-gray-500">{option.symbol}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Price:</span>
                              <span className="text-gray-900">{option.price.toFixed(2)} USDC</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Gas Amount:</span>
                              <span className="text-gray-900">{option.gasAmount.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">USDC Price:</span>
                              <span className="text-gray-900">{option.usdcPrice.toFixed(2)} USDC</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                              <span className="text-gray-500">Minimum USDC Required:</span>
                              <span className={option.minimumRequired > 0 ? 'text-gray-900' : 'text-green-500'}>
                                {option.minimumRequired.toFixed(2)} USDC
                              </span>
                            </div>
                            {option.cannotSend && (
                              <p className="text-sm text-gray-500 mt-2">Cannot send gas to the same chain</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGasOption && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700">Receiver Address</Label>
                      <div className="flex gap-2">
                        <Input
                          value={receiverAddress}
                          onChange={(e) => setReceiverAddress(e.target.value)}
                          placeholder="Enter receiver address"
                          className="flex-1 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                        />
                        <Button
                          onClick={() => setReceiverAddress(walletAddress)}
                          className="whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200"
                          disabled={!isWalletConnected}
                        >
                          My Address
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4">
                      <Button
                        onClick={handleBuyGas}
                        disabled={isLoading || !receiverAddress}
                        className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                      >
                        {isLoading ? 'Processing...' : 'Buy Gas'}
                      </Button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-red-500 text-center">
                    {error}
                  </div>
                )}

                {isSuccess && (
                  <div className="text-green-500 text-center">
                    Transaction successful!
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Section - Only show after Buy Gas */}
      {showTransfer && (
        <div className="p-8 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              {isCrossChainTransfer ? 'Cross-Chain USDC Transfer' : 'Transfer USDC'}
            </h1>
            <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
                <CardTitle className="text-center text-gray-900">
                  {isCrossChainTransfer ? 'Cross-Chain Transfer' : 'Same Chain Transfer'}
                </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
                {isCrossChainTransfer ? (
                  // Cross-Chain Transfer UI
                  <>
          <div className="space-y-2">
            <Label>Transfer Type</Label>
            <TransferTypeSelector value={transferType} onChange={setTransferType} />
                      <p className="text-sm text-gray-500">
              {transferType === 'fast'
                ? 'Faster transfers with lower finality threshold (1000 blocks)'
                : 'Standard transfers with higher finality (2000 blocks)'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Chain</Label>
              <Select
                value={String(sourceChain)}
                onValueChange={(value) => setSourceChain(Number(value))}
                          disabled={true}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source chain" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CHAINS.map((chainId) => (
                    <SelectItem key={chainId} value={String(chainId)}>
                      {CHAIN_TO_CHAIN_NAME[chainId]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destination Chain</Label>
              <Select
                value={String(destinationChain)}
                onValueChange={(value) => setDestinationChain(Number(value))}
                          disabled={true}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination chain" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CHAINS
                    .filter((chainId) => chainId !== sourceChain)
                    .map((chainId) => (
                      <SelectItem key={chainId} value={String(chainId)}>
                        {CHAIN_TO_CHAIN_NAME[chainId]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amount (USDC)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              max={parseFloat(balance)}
              step="any"
                        disabled={true}
            />
                      <p className="text-sm text-gray-500">
              {balance} available
            </p>
          </div>

          <div className="text-center">
            {showFinalTime ? (
              <div className="text-2xl font-mono">
                <span>{Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}</span>:
                <span>{(elapsedSeconds % 60).toString().padStart(2, '0')}</span>
              </div>
            ) : (
              <Timer
                isRunning={isTransferring}
                initialSeconds={elapsedSeconds}
                onTick={setElapsedSeconds}
              />
            )}
          </div>

          <ProgressSteps currentStep={currentStep} />
          <TransferLog logs={logs} />
                  </>
                ) : (
                  // Same Chain Transfer UI
                  <>
                    <div className="space-y-2">
                      <Label>Amount (USDC)</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="0"
                        max={parseFloat(balance)}
                        step="any"
                        disabled={true}
                      />
                      <p className="text-sm text-gray-500">
                        {balance} available
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Receiver Address</Label>
                      <Input
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder="Enter receiver address"
                        disabled={true}
                      />
                    </div>
                  </>
                )}

                {transferError && (
            <div className="text-red-500 text-center">
                    {transferError}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleStartTransfer}
                    disabled={isTransferring || currentStep === 'completed' || !amount || !walletClient}
                    className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    {isTransferring ? 'Transferring...' : 'Start Transfer'}
                  </Button>
                  <Button
                    onClick={handleReset}
              disabled={isTransferring || currentStep === 'completed'}
                    variant="outline"
                  >
                    {currentStep === 'completed' ? 'Transfer Complete' : 'Reset'}
              </Button>
          </div>
        </CardContent>
      </Card>
          </div>
        </div>
      )}
    </div>
  );
}