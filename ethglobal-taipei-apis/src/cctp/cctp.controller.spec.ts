import { Test, TestingModule } from '@nestjs/testing';
import { CctpController } from './cctp.controller';

describe('CctpController', () => {
  let controller: CctpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CctpController],
    }).compile();

    controller = module.get<CctpController>(CctpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
