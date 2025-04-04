import { ethers, formatUnits } from 'ethers';
import { Chain, getChainRPC } from '../constants/chain';

// Default values for gas estimation
const DEFAULT_ADDRESS = '0x9Bb9fd0ab10f2c9231F2B0bb629ED446f0216c79';
const DEFAULT_VALUE = '0.1';

export interface EstimatedFee {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasPrice: string;
}

export interface EstimatedFeeEther {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasPrice: string;
}

export interface GasCostEstimate {
  gasAmount: string;
  gasPriceInEther: string;
  maxFeeInEther: string;
  priorityFeeInEther: string;
  totalCostLegacy: string;
  totalCostEIP1559Min: string;
  totalCostEIP1559Max: string;
}

export const getEstimatedFee = async (chain: Chain): Promise<EstimatedFee> => {
  try {
    const provider = new ethers.JsonRpcProvider(getChainRPC(chain));
    const feeData = await provider.getFeeData();

    return {
      maxFeePerGas: feeData.maxFeePerGas ? formatUnits(feeData.maxFeePerGas,'ether') : '0',
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? formatUnits(feeData.maxPriorityFeePerGas,'ether') : '0',
      gasPrice: feeData.gasPrice ? formatUnits(feeData.gasPrice,'ether' ): '0',
    };
  } catch (error) {
    console.error('Error getting estimated fee:', error);
    return {
      maxFeePerGas: '0',
      maxPriorityFeePerGas: '0',
      gasPrice: '0',
    };
  }
};



/**
 * Estimate gas for ETH transfer
 * @param chain Blockchain network
 * @param from Sender address (optional, uses default if not provided)
 * @param to Recipient address (optional, uses default if not provided)
 * @param value Amount to send in ETH (optional, uses default if not provided)
 * @returns Estimated gas as string
 */
export const estimateGasForEthTransfer = async (
  chain: Chain,
  from?: string,
  to?: string,
  value?: string
): Promise<string> => {
  try {
    const provider = new ethers.JsonRpcProvider(getChainRPC(chain));
    
    // Use provided values or defaults
    const fromAddress = from || DEFAULT_ADDRESS;
    const toAddress = to || DEFAULT_ADDRESS;
    const ethValue = value || DEFAULT_VALUE;
    
    // Convert ETH to Wei
    const valueInWei = ethers.parseEther(ethValue);
    
    // Prepare transaction request
    const txRequest = {
      from: fromAddress,
      to: toAddress,
      value: valueInWei
    };
    
    // Estimate gas
    const estimatedGas = await provider.estimateGas(txRequest);
    
    return estimatedGas.toString();
  } catch (error) {
    console.error('Error estimating gas for ETH transfer:', error);
    // Return default gas value for ETH transfer as fallback
    return '21000';
  }
};

/**
 * Calculate total gas cost for an ETH transfer in Ether
 * @param chain Blockchain network
 * @param from Sender address (optional, uses default if not provided)
 * @param to Recipient address (optional, uses default if not provided)
 * @param value Amount to send in ETH (optional, uses default if not provided)
 * @returns Gas cost estimate with various pricing models
 */
export const calculateGasCost = async (
  chain: Chain,
  from?: string,
  to?: string,
  value?: string
): Promise<GasCostEstimate> => {
  try {
    // Use provided values or defaults
    const fromAddress = from || DEFAULT_ADDRESS;
    const toAddress = to || DEFAULT_ADDRESS;
    const ethValue = value || DEFAULT_VALUE;
    
    // Get estimated gas amount
    const gasAmount = await estimateGasForEthTransfer(chain, fromAddress, toAddress, ethValue);
    
    // Get fee data
    const feeData = await getEstimatedFee(chain);

    // Calculate total costs
    const gasBigInt  = BigInt(gasAmount);
    
    // Legacy gas pricing (gas price * gas)
    const totalCostLegacy = ethers.parseEther(feeData.gasPrice) * gasBigInt;
    
    // EIP-1559 min cost (priority fee * gas)
    const totalCostEIP1559Min = ethers.parseEther(feeData.maxPriorityFeePerGas) * gasBigInt;
    
    // EIP-1559 max cost (max fee * gas)
    const totalCostEIP1559Max = ethers.parseEther(feeData.maxFeePerGas) * gasBigInt;
    
    return {
      gasAmount,
      gasPriceInEther: feeData.gasPrice,
      maxFeeInEther: feeData.maxFeePerGas,
      priorityFeeInEther: feeData.maxPriorityFeePerGas,
      totalCostLegacy: formatUnits(totalCostLegacy,'ether'),
      totalCostEIP1559Min: formatUnits(totalCostEIP1559Min,'ether'),
      totalCostEIP1559Max: formatUnits(totalCostEIP1559Max,'ether'),
    };
  } catch (error) {
    console.error('Error calculating gas cost:', error);
    
    // Return zeros in case of error
    return {
      gasAmount: '0',
      gasPriceInEther: '0',
      maxFeeInEther: '0',
      priorityFeeInEther: '0',
      totalCostLegacy: '0',
      totalCostEIP1559Min: '0',
      totalCostEIP1559Max: '0',
    };
  }
}; 