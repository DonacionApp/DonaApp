import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RECAPTCHA_SECRET_KEY, RECAPTCHA_SCORE_THRESHOLD } from 'src/config/constants';

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  async verify(token?: string): Promise<boolean> {
    const secret = this.configService.get<string>(RECAPTCHA_SECRET_KEY) ?? '';
    if (!secret) return true;
    if (!token) return false;
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }).toString(),
      });
      const data = (await res.json()) as { success: boolean; score?: number };
      if (data.success !== true) return false;
      if (data.score === undefined) return true;
      const threshold = Number(this.configService.get<string>(RECAPTCHA_SCORE_THRESHOLD) ?? 0.5);
      return data.score >= threshold;
    } catch (err) {
      this.logger.warn(`reCAPTCHA verify falló: ${(err as Error).message}`);
      return false;
    }
  }
}
