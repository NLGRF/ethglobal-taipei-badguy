import { useWallet } from './contexts/WalletContext'
import { WalletProvider } from './contexts/WalletContext'
import { SUPPORTED_CHAINS } from './contexts/WalletContext'

function AppContent() {
  const { address, connect, chain, switchChain } = useWallet()
  
  return (
    <div className="min-h-screen bg-[#1E1E1E] p-4">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-normal">BadGuy</span>
          <button 
            onClick={connect}
            className="px-3 py-1 bg-[#2D2D2D] rounded text-white text-xs"
          >
            {address ? address.slice(0, 6) + '...' + address.slice(-4) : 'Connect Wallet'}
          </button>
        </div>

        {/* Chain Selector */}
        {address && (
          <div className="flex items-center gap-2">
            <select 
              value={chain?.chainId || ''} 
              onChange={(e) => switchChain(Number(e.target.value))}
              className="bg-[#2D2D2D] text-white text-xs px-2 py-1 rounded"
            >
              <option value="">Select Chain</option>
              {SUPPORTED_CHAINS.map(chain => (
                <option key={chain.chainId} value={chain.chainId}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Input Section */}
        {address && chain && (
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Input USDC"
              className="flex-1 bg-[#2D2D2D] text-white text-xs px-2 py-1 rounded"
            />
            <button className="px-3 py-1 bg-[#2D2D2D] rounded text-white text-xs">
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  )
}

export default App
