import { PartialType } from '@nestjs/mapped-types';
import { CreateCctpHistoryDto } from './create-cctp-history.dto';

export class UpdateCctpHistoryDto extends PartialType(CreateCctpHistoryDto) {} 