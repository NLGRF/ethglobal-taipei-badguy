import { Injectable } from '@nestjs/common';
import { CreateCctpDto } from './dto/create-cctp.dto';
import { UpdateCctpDto } from './dto/update-cctp.dto';

@Injectable()
export class CctpService {
  create(createCctpDto: CreateCctpDto) {
    return 'This action adds a new cctp';
  }

  findAll() {
    return `This action returns all cctp`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cctp`;
  }

  update(id: number, updateCctpDto: UpdateCctpDto) {
    return `This action updates a #${id} cctp`;
  }

  remove(id: number) {
    return `This action removes a #${id} cctp`;
  }
}
