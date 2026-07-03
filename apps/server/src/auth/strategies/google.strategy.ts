import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const clientId = configService.get<string>('google.client_id');
    const clientSecret = configService.get<string>('google.client_secret');

    if (!clientId || !clientSecret) {
      // Create a dummy strategy to prevent crash — Google login will be disabled
      super({
        clientID: 'disabled',
        clientSecret: 'disabled',
        callbackURL: 'http://localhost:3001/api/v1/auth/google/callback',
        scope: ['email', 'profile'],
      });
      this.logger.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
      return;
    }

    super({
      clientID: clientId,
      clientSecret: clientSecret,
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
    const { emails, displayName, photos } = profile;
    const email = emails?.[0]?.value;
    const name = displayName || email?.split('@')[0] || 'User';
    const avatarUrl = photos?.[0]?.value;

    if (!email) {
      done(new Error('No email found from Google profile'), undefined);
      return;
    }

    done(null, { id: profile.id, email, name, avatarUrl });
  }
}
