import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.client_id') || '',
      clientSecret: configService.get<string>('google.client_secret') || '',
      callbackURL: configService.get<string>('google.callback_url') || 'http://localhost:3001/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: { id: string; emails?: { value: string }[]; displayName?: string; photos?: { value: string }[] },
    done: VerifyCallback,
  ): Promise<void> {
    const { id, emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    const name = displayName || email?.split('@')[0] || 'User';
    const avatarUrl = photos?.[0]?.value;

    done(null, { id, email, name, avatarUrl });
  }
}
