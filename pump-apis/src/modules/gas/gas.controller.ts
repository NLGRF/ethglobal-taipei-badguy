import { Controller, Get, Query, Post, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { GasService } from './gas.service';
import { 
  GasFeeResponseDto, 
  EstimateGasRequestDto, 
  EstimateGasResponseDto,
  GasCostResponseDto,
  ChainOnlyRequestDto
} from './dto/gas.dto';

@ApiTags('Gas Estimation')
@Controller('gas')
export class GasController {
  constructor(private readonly gasService: GasService) {}

  @ApiOperation({ summary: 'Get gas fee estimates for a blockchain in Ether' })
  @ApiQuery({
    name: 'chain',
    description: 'Blockchain network (e.g., ethereum, polygon, base)',
    required: true,
    example: 'ethereum',
  })
  @ApiResponse({
    status: 200,
    description: 'Gas fee estimates retrieved successfully',
    type: GasFeeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or invalid chain parameter',
  })
  @Get('fee')
  async getGasFee(@Query('chain') chain: string): Promise<GasFeeResponseDto> {
    if (!chain) {
      return {
        success: false,
        error: 'Chain parameter is required',
      };
    }

    return this.gasService.getGasFeeEstimates(chain);
  }

  @ApiOperation({ 
    summary: 'Estimate gas for an ETH transfer',
    description: 'Estimates gas for a standard ETH transfer. If only chain is provided, default address and amount values will be used.'
  })
  @ApiBody({ type: EstimateGasRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Gas estimated successfully',
    type: EstimateGasResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or invalid chain parameter',
  })
  @Post('estimate')
  async estimateGas(
    @Body() body: EstimateGasRequestDto | ChainOnlyRequestDto,
  ): Promise<EstimateGasResponseDto> {
    const { chain } = body;

    if (!chain) {
      return {
        success: false,
        error: 'Chain parameter is required',
      };
    }

    if ('from' in body && 'to' in body && 'value' in body) {
      // Full request with all parameters
      return this.gasService.estimateGasForTransfer(chain, body.from, body.to, body.value);
    } else {
      // Chain-only request, use defaults
      return this.gasService.estimateGasForTransfer(chain);
    }
  }

  @ApiOperation({ 
    summary: 'Calculate total gas cost for an ETH transfer',
    description: 'Calculates the total gas cost in ETH for a standard transfer. If only chain is provided, default address and amount values will be used.'
  })
  @ApiBody({ type: EstimateGasRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Gas cost calculated successfully',
    type: GasCostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or invalid chain parameter',
  })
  @Post('cost')
  async calculateGasCost(
    @Body() body: EstimateGasRequestDto | ChainOnlyRequestDto,
  ): Promise<GasCostResponseDto> {
    const { chain } = body;

    if (!chain) {
      return {
        success: false,
        error: 'Chain parameter is required',
      };
    }

    if ('from' in body && 'to' in body && 'value' in body) {
      // Full request with all parameters
      return this.gasService.calculateGasCostForTransfer(chain, body.from, body.to, body.value);
    } else {
      // Chain-only request, use defaults
      return this.gasService.calculateGasCostForTransfer(chain);
    }
  }

  @ApiOperation({ 
    summary: 'Get gas fee estimates with a simple GET request',
    description: 'A convenience endpoint for quickly getting gas fees for a chain with a GET request' 
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network (e.g., ethereum, polygon, base)',
    required: true,
    example: 'ethereum',
  })
  @ApiResponse({
    status: 200,
    description: 'Gas fee estimates retrieved successfully',
    type: GasFeeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or invalid chain parameter',
  })
  @Get('fee/:chain')
  async getGasFeeByParam(@Param('chain') chain: string): Promise<GasFeeResponseDto> {
    if (!chain) {
      return {
        success: false,
        error: 'Chain parameter is required',
      };
    }

    return this.gasService.getGasFeeEstimates(chain);
  }

  @ApiOperation({ 
    summary: 'Get gas cost estimates with a simple GET request',
    description: 'A convenience endpoint for quickly getting gas cost for a chain with a GET request using default values for address and amount' 
  })
  @ApiParam({
    name: 'chain',
    description: 'Blockchain network (e.g., ethereum, polygon, base)',
    required: true,
    example: 'ethereum',
  })
  @ApiResponse({
    status: 200,
    description: 'Gas cost calculated successfully',
    type: GasCostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or invalid chain parameter',
  })
  @Get('cost/:chain')
  async getGasCostByParam(@Param('chain') chain: string): Promise<GasCostResponseDto> {
    if (!chain) {
      return {
        success: false,
        error: 'Chain parameter is required',
      };
    }

    return this.gasService.calculateGasCostForTransfer(chain);
  }
} 