import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CctpHistoryService } from './cctp-history.service';
import { CreateCctpHistoryDto } from './dto/create-cctp-history.dto';
import { UpdateCctpHistoryDto } from './dto/update-cctp-history.dto';

@Controller('cctp-history')
export class CctpHistoryController {
  constructor(private readonly cctpHistoryService: CctpHistoryService) {}

  @Post()
  create(@Body() createCctpHistoryDto: CreateCctpHistoryDto) {
    return this.cctpHistoryService.create(createCctpHistoryDto);
  }

  @Get()
  findAll() {
    return this.cctpHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cctpHistoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCctpHistoryDto: UpdateCctpHistoryDto) {
    return this.cctpHistoryService.update(id, updateCctpHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cctpHistoryService.remove(id);
  }
} 