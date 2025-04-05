import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PriceResponseDto } from './dto/price.dto';
import { ConvertResponseDto } from './dto/price.dto';

interface TokenConfig {
  symbol: string;
  gasName: string;
}

@Injectable()
export class PriceService {
  private readonly chainConfigs: Record<string, TokenConfig> = {
    'Ethereum': { symbol: 'ETH', gasName: 'ETH' },
    'Base': { symbol: 'BASE', gasName: 'ETH' },
    'Polygon': { symbol: 'MATIC', gasName: 'MATIC' },
    'Celo': { symbol: 'CELO', gasName: 'CELO' },
    'Rootstock': { symbol: 'RBTC', gasName: 'RBTC' }
  };

  constructor(private configService: ConfigService) {}

  async getGasPrice(chain: string, usdcAmount: number = 1): Promise<PriceResponseDto> {
    const apiKey = this.configService.get<string>('CMC_API_KEY');
    const apiUrl = this.configService.get<string>('CMC_API_URL');
    const chainConfig = this.chainConfigs[chain];

    if (!apiKey || !apiUrl) {
      throw new Error('Missing CoinMarketCap API configuration');
    }

    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    try {
      const response = await axios.get(apiUrl, {
        params: {
          symbol: chainConfig.symbol,
          convert: 'USD'
        },
        headers: {
          'X-CMC_PRO_API_KEY': apiKey
        }
      });

      const tokenData = response.data?.data?.[chainConfig.symbol];
      if (!tokenData?.quote?.USD?.price) {
        throw new Error('Failed to get price from response');
      }

      const tokenPrice = tokenData.quote.USD.price;
      const gasAmount = usdcAmount / tokenPrice;

      return {
        chain,
        gasName: chainConfig.gasName,
        price: tokenPrice,
        gasUnit: 'GWEI',
        gasAmount,
        usdcPrice: 1 // USDC is pegged to USD
      };
    } catch (error) {
      console.error(`Failed to fetch ${chain} price:`, error);
      throw error;
    }
  }

  async getAllGasPrices(usdcAmount: number = 1): Promise<PriceResponseDto[]> {
    const chains = ['Ethereum', 'Base', 'Polygon', 'Celo', 'Rootstock'];
    const prices = await Promise.all(
      chains.map(chain => this.getGasPrice(chain, usdcAmount))
    );
    return prices;
  }

  async convertUsdcToEth(chain: string, usdcAmount: number): Promise<ConvertResponseDto> {
    const priceData = await this.getGasPrice(chain);
    // Calculate ETH amount: USDC amount / (ETH price in USDC)
    // Example: 10 USDC / 1792.67 USDC/ETH = 0.005577 ETH
    const ethAmount = usdcAmount / priceData.price;
    
    return {
      chain,
      usdcAmount,
      ethAmount,
    };
  }

  async convertUsdcToEthAllChains(usdcAmount: number): Promise<ConvertResponseDto[]> {
    const chains = ['Ethereum', 'Base', 'Polygon', 'Celo', 'Rootstock'];
    const conversions = await Promise.all(
      chains.map(chain => this.convertUsdcToEth(chain, usdcAmount))
    );
    return conversions;
  }
} 