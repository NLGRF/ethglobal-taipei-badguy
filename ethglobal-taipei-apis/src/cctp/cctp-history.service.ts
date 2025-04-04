import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CctpHistory } from './entities/cctp-history.entity';
import { CreateCctpHistoryDto } from './dto/create-cctp-history.dto';
import { UpdateCctpHistoryDto } from './dto/update-cctp-history.dto';

@Injectable()
export class CctpHistoryService {
  constructor(
    @InjectRepository(CctpHistory)
    private readonly cctpHistoryRepository: Repository<CctpHistory>,
  ) {}

  async create(createCctpHistoryDto: CreateCctpHistoryDto): Promise<CctpHistory> {
    const cctpHistory = this.cctpHistoryRepository.create(createCctpHistoryDto);
    return this.cctpHistoryRepository.save(cctpHistory);
  }

  async findAll(): Promise<CctpHistory[]> {
    return this.cctpHistoryRepository.find();
  }

  async findOne(id: string): Promise<CctpHistory> {
    const cctpHistory = await this.cctpHistoryRepository.findOne({ where: { id } });
    if (!cctpHistory) {
      throw new NotFoundException(`CCTP history with ID ${id} not found`);
    }
    return cctpHistory;
  }

  async update(id: string, updateCctpHistoryDto: UpdateCctpHistoryDto): Promise<CctpHistory> {
    const cctpHistory = await this.findOne(id);
    await this.cctpHistoryRepository.update(id, updateCctpHistoryDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const cctpHistory = await this.findOne(id);
    await this.cctpHistoryRepository.delete(id);
  }
} 