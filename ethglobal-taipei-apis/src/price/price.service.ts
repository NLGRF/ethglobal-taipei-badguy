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
    'Base': { symbol: 'BASE', gasName: 'BASE' },
    'Polygon': { symbol: 'MATIC', gasName: 'MATIC' },
    'Celo': { symbol: 'CELO', gasName: 'CELO' },
    'Rootstock': { symbol: 'RBTC', gasName: 'RBTC' }
  };

  constructor(private configService: ConfigService) {}

  async getAllGasPrices(usdcAmount: number = 1): Promise<PriceResponseDto[]> {
    const apiKey = this.configService.get<string>('CMC_API_KEY');
    const apiUrl = this.configService.get<string>('CMC_API_URL');

    if (!apiKey || !apiUrl) {
      throw new Error('Missing CoinMarketCap API configuration');
    }

    try {
      const symbols = Object.values(this.chainConfigs).map(c => c.symbol).join(',');
      const response = await axios.get(apiUrl, {
        params: {
          symbol: symbols,
          convert: 'USD'
        },
        headers: {
          'X-CMC_PRO_API_KEY': apiKey
        }
      });

      const prices: PriceResponseDto[] = [];
      for (const [chain, config] of Object.entries(this.chainConfigs)) {
        const tokenData = response.data?.data?.[config.symbol];
        if (!tokenData?.quote?.USD?.price) {
          console.error(`No price data for ${chain}`);
          prices.push({
            chain,
            gasName: config.gasName,
            price: 0,
            gasUnit: 'GWEI',
            gasAmount: 0,
            usdcPrice: 1
          });
          continue;
        }

        const tokenPrice = tokenData.quote.USD.price;
        const gasAmount = usdcAmount / tokenPrice;

        prices.push({
          chain,
          gasName: config.gasName,
          price: tokenPrice,
          gasUnit: 'GWEI',
          gasAmount,
          usdcPrice: 1
        });
      }

      return prices;
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      return Object.entries(this.chainConfigs).map(([chain, config]) => ({
        chain,
        gasName: config.gasName,
        price: 0,
        gasUnit: 'GWEI',
        gasAmount: 0,
        usdcPrice: 1
      }));
    }
  }

  async getGasPrice(chain: string, usdcAmount: number = 1): Promise<PriceResponseDto> {
    const prices = await this.getAllGasPrices(usdcAmount);
    const price = prices.find(p => p.chain === chain);
    if (!price) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    return price;
  }

  async convertUsdcToEth(chain: string, usdcAmount: number): Promise<ConvertResponseDto> {
    const priceData = await this.getGasPrice(chain);
    const ethAmount = usdcAmount / priceData.price;
    
    return {
      chain,
      usdcAmount,
      ethAmount,
    };
  }

  async convertUsdcToEthAllChains(usdcAmount: number): Promise<ConvertResponseDto[]> {
    const prices = await this.getAllGasPrices(usdcAmount);
    return prices.map(price => ({
      chain: price.chain,
      usdcAmount,
      ethAmount: price.price > 0 ? usdcAmount / price.price : 0
    }));
  }
} 