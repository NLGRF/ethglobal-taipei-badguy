import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChainConfig {
  symbol: string;
  cmcId: string;
}

@Injectable()
export class PriceService {
  private readonly chainConfigs: Record<string, ChainConfig> = {
    'Ethereum': { symbol: 'ETH', cmcId: '1027' },
    'Base': { symbol: 'ETH', cmcId: '1027' },
    'Polygon': { symbol: 'POL', cmcId: '137' },
    'Celo': { symbol: 'CELO', cmcId: '5567' },
    'Rootstock': { symbol: 'RBTC', cmcId: '3626' }
  };

  constructor(private configService: ConfigService) {}

  async getGasPrice(chain: string): Promise<number> {
    try {
      const config = this.chainConfigs[chain];
      if (!config) return 0;

      const apiKey = this.configService.get<string>('CMC_API_KEY');
      if (!apiKey) {
        console.error('Missing CoinMarketCap API key');
        return 0;
      }

      const res = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${config.cmcId}&convert=USDC`, {
        headers: {
          'X-CMC_PRO_API_KEY': apiKey
        }
      });
      
      const data = await res.json();
      return data.data[config.cmcId].quote.USDC.price;
    } catch (error) {
      console.error(`Failed to fetch ${chain} price:`, error);
      return 0;
    }
  }

  async getAllGasPrices(): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    for (const chain of Object.keys(this.chainConfigs)) {
      prices[chain] = await this.getGasPrice(chain);
    }
    return prices;
  }

  async convertUsdcToEth(amount: number): Promise<number> {
    const ethPrice = await this.getGasPrice('Ethereum');
    return ethPrice > 0 ? amount / ethPrice : 0;
  }

  getGasName(chain: string): string {
    return this.chainConfigs[chain]?.symbol || '';
  }
} 