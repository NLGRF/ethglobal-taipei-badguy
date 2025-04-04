import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CctpService } from './cctp.service';
import { CreateCctpDto } from './dto/create-cctp.dto';
import { UpdateCctpDto } from './dto/update-cctp.dto';

@Controller('cctp')
export class CctpController {
  constructor(private readonly cctpService: CctpService) {}

  @Post()
  create(@Body() createCctpDto: CreateCctpDto) {
    return this.cctpService.create(createCctpDto);
  }

  @Get()
  findAll() {
    return this.cctpService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cctpService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCctpDto: UpdateCctpDto) {
    return this.cctpService.update(+id, updateCctpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cctpService.remove(+id);
  }
}
