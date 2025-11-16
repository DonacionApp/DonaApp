import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
//verifica que el servicio de estadisticas este definido
describe('StatisticsService', () => {
  let service: StatisticsService;
//por cada prueba se crea un modulo de testing
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatisticsService],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
