import { Injectable } from '@nestjs/common';
import { Chain } from '../../common/constants/chain';
import { 
  getEstimatedFee, 
  estimateGasForEthTransfer,
  calculateGasCost
} from '../../common/web3helper/estimatedfee';
import { 
  GasFeeResponseDto, 
  EstimateGasResponseDto,
  EstimatedGasDataDto,
  GasCostResponseDto,
  GasCostDataDto
} from './dto/gas.dto';

@Injectable()
export class GasService {
  /**
   * Get gas fee estimates for a specific chain
   * @param chainName Name of the chain as defined in Chain enum
   * @returns Gas fee estimates in Ether
   */
  async getGasFeeEstimates(chainName: string): Promise<GasFeeResponseDto> {
    try {
      // Validate and convert chain name
      const chain = this.validateChain(chainName);
      if (!chain) {
        throw new Error(`Invalid chain: ${chainName}`);
      }

      // Get gas fee estimates
      const feeData = await getEstimatedFee(chain);
      
      return {
        success: true,
        data: feeData,
        chainId: Chain[chain],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get gas fee estimates',
      };
    }
  }

  /**
   * Estimate gas for ETH transfer
   * @param chainName Name of the chain as defined in Chain enum
   * @param from Sender address (optional)
   * @param to Recipient address (optional)
   * @param value Amount to send in ETH (optional)
   * @returns Estimated gas
   */
  async estimateGasForTransfer(
    chainName: string, 
    from?: string, 
    to?: string, 
    value?: string
  ): Promise<EstimateGasResponseDto> {
    try {
      // Validate and convert chain name
      const chain = this.validateChain(chainName);
      if (!chain) {
        throw new Error(`Invalid chain: ${chainName}`);
      }

      // Estimate gas
      const estimatedGas = await estimateGasForEthTransfer(chain, from, to, value);
      
      const gasData: EstimatedGasDataDto = {
        estimatedGas,
      };
      
      return {
        success: true,
        data: gasData,
        chainId: Chain[chain],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to estimate gas',
      };
    }
  }

  /**
   * Calculate total gas cost for ETH transfer
   * @param chainName Name of the chain as defined in Chain enum
   * @param from Sender address (optional)
   * @param to Recipient address (optional)
   * @param value Amount to send in ETH (optional)
   * @returns Calculated gas cost in different models
   */
  async calculateGasCostForTransfer(
    chainName: string, 
    from?: string, 
    to?: string, 
    value?: string
  ): Promise<GasCostResponseDto> {
    try {
      // Validate and convert chain name
      const chain = this.validateChain(chainName);
      if (!chain) {
        throw new Error(`Invalid chain: ${chainName}`);
      }

      // Calculate gas cost
      const costData = await calculateGasCost(chain, from, to, value);
      
      const gasCostData: GasCostDataDto = costData;
      
      return {
        success: true,
        data: gasCostData,
        chainId: Chain[chain],
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to calculate gas cost',
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
} 