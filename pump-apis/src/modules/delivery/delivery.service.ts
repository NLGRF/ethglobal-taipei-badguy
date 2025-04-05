import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { Chain, getChainRPC, getGasSellerAddress } from '../../common/constants/chain';
import { DeliveryStatusDto, DeliveryResponseDto } from './dto/delivery.dto';
import CoinSeller from '../../common/web3helper/conseller';

@Injectable()
export class DeliveryService {
  private readonly DEFAULT_CONFIRMATIONS = 1;
  private readonly DEFAULT_TIMEOUT = 60; // seconds
  private readonly MAX_TIMEOUT = 300; // maximum 5 minutes

  /**
   * Deliver a transaction (wait for it to be mined with specified confirmations)
   * @param chainName Name of the chain as defined in Chain enum
   * @param txHash Transaction hash to deliver
   * @param confirmations Number of confirmations required (default: 1)
   * @param timeout Maximum waiting time in seconds (default: 60)
   * @returns Delivery status
   */
  async deliverTransaction(
    chainName: string, 
    txHash: string,
    confirmations = this.DEFAULT_CONFIRMATIONS,
    timeout = this.DEFAULT_TIMEOUT
  ): Promise<DeliveryResponseDto> {
    try {
      // Validate and convert chain name
      const chain = this.validateChain(chainName);
      if (!chain) {
        throw new Error(`Invalid chain: ${chainName}`);
      }

      // Validate transaction hash
      if (!this.isValidTxHash(txHash)) {
        throw new Error('Invalid transaction hash format');
      }

      // Cap confirmations and timeout to reasonable values
      const requiredConfirmations = Math.min(Math.max(1, confirmations), 12);
      const waitTimeout = Math.min(Math.max(10, timeout), this.MAX_TIMEOUT);

      // Get provider for the specified chain
      const provider = new ethers.JsonRpcProvider(getChainRPC(chain));
      
      // Check if transaction exists
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        return {
          success: false,
          error: 'Transaction not found',
          chainId: Chain[chain],
        };
      }

      // Wait for transaction to be mined with specified confirmations
      const receipt = await provider.waitForTransaction(
        txHash, 
        requiredConfirmations,
        waitTimeout * 1000 // Convert to milliseconds
      );

      if (!receipt) {
        return {
          success: false,
          error: 'Transaction delivery timed out',
          chainId: Chain[chain],
          data: {
            txHash,
            status: 'timeout',
            confirmations: 0,
          }
        };
      }

      const currentBlock = await provider.getBlockNumber();
      const txBlock = receipt.blockNumber;
      const currentConfirmations = currentBlock - txBlock + 1;
      
      // Get block timestamp
      const block = await provider.getBlock(txBlock);
      const minedAt = block ? new Date(Number(block.timestamp) * 1000).toISOString() : undefined;

      const status: DeliveryStatusDto = {
        txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations: currentConfirmations,
        blockNumber: txBlock.toString(),
        minedAt,
      };

      return {
        success: true,
        data: status,
        chainId: Chain[chain],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to deliver transaction',
      };
    }
  }

  /**
   * Get current status of a transaction
   * @param chainName Name of the chain as defined in Chain enum
   * @param txHash Transaction hash to check
   * @returns Current transaction status
   */
  async getTransactionStatus(
    chainName: string,
    txHash: string
  ): Promise<DeliveryResponseDto> {
    try {
      // Validate and convert chain name
      const chain = this.validateChain(chainName);
      if (!chain) {
        throw new Error(`Invalid chain: ${chainName}`);
      }

      // Validate transaction hash
      if (!this.isValidTxHash(txHash)) {
        throw new Error('Invalid transaction hash format');
      }

      // Get provider for the specified chain
      const provider = new ethers.JsonRpcProvider(getChainRPC(chain));
      
      // Get transaction
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        return {
          success: false,
          error: 'Transaction not found',
          chainId: Chain[chain],
        };
      }

      let status: DeliveryStatusDto;
      
      // If transaction is not mined yet
      if (!tx.blockNumber) {
        status = {
          txHash,
          status: 'pending',
          confirmations: 0,
        };
      } else {
        // Get transaction receipt for status
        const receipt = await provider.getTransactionReceipt(txHash);
        
        const currentBlock = await provider.getBlockNumber();
        const txBlock = tx.blockNumber;
        const currentConfirmations = currentBlock - txBlock + 1;
        
        // Get block timestamp
        const block = await provider.getBlock(txBlock);
        const minedAt = block ? new Date(Number(block.timestamp) * 1000).toISOString() : undefined;

        status = {
          txHash,
          status: receipt && receipt.status === 1 ? 'confirmed' : 'failed',
          confirmations: currentConfirmations,
          blockNumber: txBlock.toString(),
          minedAt,
        };
      }

      return {
        success: true,
        data: status,
        chainId: Chain[chain],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get transaction status',
      };
    }
  }

  /**
   * Send a coin transfer using the CoinSeller
   * @param chainName Name of the chain 
   * @param recipient Recipient address
   * @param amount Amount to transfer
   * @param orderId Unique order ID
   * @returns Transfer result with transaction hash
   */
  async transferCoins(
    chainName: string,
    recipient: string,
    amount: number,
    orderId: string
  ): Promise<DeliveryResponseDto> {
    try {
      // Validate and convert chain name
      const chain = this.validateChain(chainName);
      if (!chain) {
        throw new Error(`Invalid chain: ${chainName}`);
      }

      // Validate recipient address
      if (!this.isValidAddress(recipient)) {
        throw new Error('Invalid recipient address format');
      }

      // Create CoinSeller instance for the chain
      const coinSeller = new CoinSeller(chainName);
      
      // Transfer coins to the recipient
      const result = await coinSeller.coinTransferToBuyer(
        recipient,
        amount,
        orderId
      );

      // If transfer failed
      if (!result.status) {
        return {
          success: false,
          error: 'Transfer failed',
          chainId: Chain[chain],
        };
      }

      // Get transaction details
      const txHash = result.hash;
      
      // Return basic success response with transaction hash
      return {
        success: true,
        data: {
          txHash,
          status: 'pending',
          confirmations: 0,
        },
        chainId: Chain[chain],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to transfer coins',
      };
    }
  }

  /**
   * Estimate gas for a coin transfer
   * @param chainName Name of the chain
   * @param recipient Recipient address
   * @param amount Amount to transfer
   * @param orderId Unique order ID
   * @returns Estimated gas
   */
  async estimateTransferGas(
    chainName: string,
    recipient: string,
    amount: number,
    orderId: string
  ): Promise<DeliveryResponseDto> {
    try {
      // Validate and convert chain name
      const chain = this.validateChain(chainName);
      if (!chain) {
        throw new Error(`Invalid chain: ${chainName}`);
      }

      // Validate recipient address
      if (!this.isValidAddress(recipient)) {
        throw new Error('Invalid recipient address format');
      }

      // Create CoinSeller instance for the chain
      const coinSeller = new CoinSeller(chainName);
      
      // Estimate gas
      const estimatedGas = await coinSeller.estimateUsageGas(
        recipient,
        amount,
        orderId
      );

      return {
        success: true,
        data: {
          txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          status: 'estimation',
          confirmations: 0,
          gasEstimate: estimatedGas.toString(),
        },
        chainId: Chain[chain],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to estimate transfer gas',
      };
    }
  }

  /**
   * Validate chain name and convert to Chain enum
   * @param chainName Name of the chain
   * @returns Chain enum value or null if invalid
   */
  private validateChain(chainName: string): Chain | null {
    const upperChainName = chainName.toUpperCase();
    if (Chain[upperChainName]) {
      return Chain[upperChainName];
    }
    return null;
  }

  /**
   * Validate transaction hash format
   * @param txHash Transaction hash to validate
   * @returns Whether the hash is valid
   */
  private isValidTxHash(txHash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(txHash);
  }

  /**
   * Validate Ethereum address format
   * @param address Ethereum address to validate
   * @returns Whether the address is valid
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
} 