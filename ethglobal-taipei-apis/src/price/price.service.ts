import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PriceResponseDto } from './dto/price.dto';
import { ConvertResponseDto } from './dto/price.dto';

interface CoinMarketCapResponse {
  data: {
    [key: string]: {
      quote: {
        [key: string]: {
          price: number;
        };
      };
    };
  };
}

@Injectable()
export class PriceService {
  constructor(private configService: ConfigService) {}

  async getAllGasPrices(usdcAmount: number = 1): Promise<PriceResponseDto[]> {
    const chains = ['Ethereum', 'Base', 'Linea'];
    const prices = await Promise.all(
      chains.map(chain => this.getGasPrice(chain, usdcAmount))
    );
    return prices;
  }

  async getGasPrice(chain: string, usdcAmount: number = 1): Promise<PriceResponseDto> {
    const apiKey = this.configService.get<string>('CMC_API_KEY') || '';
    const apiUrl = this.configService.get<string>('CMC_API_URL') || '';
    const ethSymbol = this.configService.get<string>('CMC_ETH_SYMBOL') || 'ETH';
    const usdcSymbol = this.configService.get<string>('CMC_USDC_SYMBOL') || 'USDC';

    if (!apiKey || !apiUrl) {
      throw new Error('Missing CoinMarketCap API configuration');
    }

    try {
      const response = await axios.get<CoinMarketCapResponse>(apiUrl, {
        params: {
          symbol: `${ethSymbol},${usdcSymbol}`,
          convert: 'USD',
        },
        headers: {
          'X-CMC_PRO_API_KEY': apiKey,
        },
      });

      const ethData = response.data?.data?.[ethSymbol]?.quote?.USD;
      const usdcData = response.data?.data?.[usdcSymbol]?.quote?.USD;

      if (!ethData?.price || !usdcData?.price) {
        throw new Error('Failed to get price from response');
      }

      // Calculate gas amount in GWEI: USDC amount / ETH price
      const gasAmount = usdcAmount / ethData.price;

      return {
        chain,
        gasName: 'ETH',
        price: ethData.price,
        gasUnit: 'GWEI',
        gasAmount,
        usdcPrice: usdcData.price,
      };
    } catch (error) {
      throw new Error(`Failed to fetch gas price: ${error.message}`);
    }
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
    const chains = ['Ethereum', 'Base', 'Linea'];
    const conversions = await Promise.all(
      chains.map(chain => this.convertUsdcToEth(chain, usdcAmount))
    );
    return conversions;
  }
} 