import { Test, TestingModule } from '@nestjs/testing';

jest.mock('./notify.gateway', () => ({
  NotifyGateway: class NotifyGateway {},
}));

const { NotifyGateway } = require('./notify.gateway');

describe('NotifyGateway', () => {
  let gateway: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotifyGateway],
    }).compile();

  gateway = module.get<any>(NotifyGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
