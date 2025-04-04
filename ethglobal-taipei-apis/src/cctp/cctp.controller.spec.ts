import { Test, TestingModule } from '@nestjs/testing';
import { CctpController } from './cctp.controller';
import { CctpService } from './cctp.service';

describe('CctpController', () => {
  let controller: CctpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CctpController],
      providers: [CctpService],
    }).compile();

    controller = module.get<CctpController>(CctpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
