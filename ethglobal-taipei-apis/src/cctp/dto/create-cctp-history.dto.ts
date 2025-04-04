import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCctpHistoryDto {
  @IsString()
  @IsNotEmpty()
  sourceChain: string;

  @IsString()
  @IsNotEmpty()
  destinationChain: string;

  @IsString()
  @IsNotEmpty()
  sourceAddress: string;

  @IsString()
  @IsNotEmpty()
  destinationAddress: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  transactionHash?: string;
} 