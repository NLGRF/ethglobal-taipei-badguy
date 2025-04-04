import { PartialType } from '@nestjs/mapped-types';
import { CreateCctpDto } from './create-cctp.dto';

export class UpdateCctpDto extends PartialType(CreateCctpDto) {}
