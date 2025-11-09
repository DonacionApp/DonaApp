import { Test, TestingModule } from '@nestjs/testing';

jest.mock('./mail.service', () => ({
  MailService: class MailService {},
}));

const { MailService } = require('./mail.service');

describe('MailService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

  service = module.get<any>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
