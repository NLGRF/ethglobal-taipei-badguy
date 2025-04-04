import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty() amount: string;
  @ApiProperty() sourceChain: string;
  @ApiProperty() recipient: string;
  @ApiProperty() destinationDomain: number;
  @ApiProperty() destinationCaller: string;
}
