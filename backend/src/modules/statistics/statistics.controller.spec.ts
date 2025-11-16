import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';

describe('StatisticsController', () => {
  let controller: StatisticsController;
//esto sirve para hacer pruebas unitarias
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
    }).compile();
//verifica que el controlador este definido
    controller = module.get<StatisticsController>(StatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
