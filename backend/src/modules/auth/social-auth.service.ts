import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GOOGLE_CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  MICROSOFT_CALLBACK_URL,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_TENANT_ID,
} from 'src/config/constants';

export type SocialProvider = 'google' | 'microsoft';

export interface SocialProfile {
  provider: SocialProvider;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

@Injectable()
export class SocialAuthService {
  constructor(private readonly configService: ConfigService) {}

  private providerConfig(provider: SocialProvider): ProviderConfig {
    if (provider === 'google') {
      return {
        clientId: this.configService.get<string>(GOOGLE_CLIENT_ID) ?? '',
        clientSecret: this.configService.get<string>(GOOGLE_CLIENT_SECRET) ?? '',
        callbackUrl: this.configService.get<string>(GOOGLE_CALLBACK_URL) ?? '',
      };
    }
    return {
      clientId: this.configService.get<string>(MICROSOFT_CLIENT_ID) ?? '',
      clientSecret: this.configService.get<string>(MICROSOFT_CLIENT_SECRET) ?? '',
      callbackUrl: this.configService.get<string>(MICROSOFT_CALLBACK_URL) ?? '',
    };
  }

  isEnabled(provider: SocialProvider): boolean {
    const c = this.providerConfig(provider);
    return Boolean(c.clientId && c.clientSecret);
  }

  private assertEnabled(provider: SocialProvider): ProviderConfig {
    const c = this.providerConfig(provider);
    if (!c.clientId || !c.clientSecret) {
      throw new NotFoundException(`El login social con ${provider} no está configurado.`);
    }
    return c;
  }

  getAuthUrl(provider: SocialProvider): string {
    const c = this.assertEnabled(provider);
    if (provider === 'google') return this.googleAuthUrl(c);
    return this.microsoftAuthUrl(c);
  }

  async getProfile(provider: SocialProvider, code: string): Promise<SocialProfile> {
    this.assertEnabled(provider);
    if (provider === 'google') return this.googleProfile(code);
    return this.microsoftProfile(code);
  }

  private googleAuthUrl(c: ProviderConfig): string {
    const params = new URLSearchParams({
      client_id: c.clientId,
      redirect_uri: c.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private async googleProfile(code: string): Promise<SocialProfile> {
    const c = this.providerConfig('google');
    const body = new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      redirect_uri: c.callbackUrl,
      grant_type: 'authorization_code',
      code,
    });
    const token = await this.postForm('https://oauth2.googleapis.com/token', body, 'google');
    const me = await this.getJson(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      str(token.access_token),
      'google',
    );
    return {
      provider: 'google',
      providerId: str(me.sub),
      email: str(me.email),
      firstName: str(me.given_name),
      lastName: str(me.family_name),
      avatar: str(me.picture),
    };
  }

  private microsoftAuthUrl(c: ProviderConfig): string {
    const params = new URLSearchParams({
      client_id: c.clientId,
      response_type: 'code',
      redirect_uri: c.callbackUrl,
      response_mode: 'query',
      scope: 'openid profile email User.Read',
    });
    const tenantId = this.configService.get<string>(MICROSOFT_TENANT_ID) || 'common';
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  private async microsoftProfile(code: string): Promise<SocialProfile> {
    const c = this.providerConfig('microsoft');
    const tenantId = this.configService.get<string>(MICROSOFT_TENANT_ID) || 'common';
    const body = new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      redirect_uri: c.callbackUrl,
      grant_type: 'authorization_code',
      code,
      scope: 'openid profile email User.Read',
    });
    const token = await this.postForm(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      body,
      'microsoft',
    );

    const idTokenEmail = str(token.id_token) ? this.emailFromIdToken(str(token.id_token)) : '';

    const me = await this.getJson(
      'https://graph.microsoft.com/v1.0/me',
      str(token.access_token),
      'microsoft',
    );
    const email = idTokenEmail || str(me.mail) || str(me.userPrincipalName);

    return {
      provider: 'microsoft',
      providerId: str(me.id),
      email,
      firstName: str(me.givenName),
      lastName: str(me.surname),
      avatar: '',
    };
  }

  private emailFromIdToken(idToken: string): string {
    try {
      const payload = JSON.parse(
        Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'),
      ) as Record<string, unknown>;
      return str(payload.email) || str(payload.preferred_username);
    } catch {
      return '';
    }
  }

  private async postForm(
    url: string,
    body: URLSearchParams,
    provider: SocialProvider,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) this.fail(provider);
    return (await res.json()) as Record<string, unknown>;
  }

  private async getJson(
    url: string,
    bearerToken: string | undefined,
    provider: SocialProvider,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(url, {
      headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined,
    });
    if (!res.ok) this.fail(provider);
    return (await res.json()) as Record<string, unknown>;
  }

  private fail(provider: SocialProvider): never {
    throw new BadGatewayException(`No se pudo completar el intercambio OAuth con ${provider}.`);
  }
}
