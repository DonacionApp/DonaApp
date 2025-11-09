import { Test, TestingModule } from '@nestjs/testing';
<<<<<<< HEAD

jest.mock('./mail.service', () => ({
  MailService: class MailService {},
}));

const { MailService } = require('./mail.service');

describe('MailService', () =>  {
=======

jest.mock('./mail.service', () => ({
  MailService: class MailService {},
}));

const { MailService } = require('./mail.service');

describe('MailService', () => {
>>>>>>> 90647fdbb48d367c66bcfb0381329a184c7eec38
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
