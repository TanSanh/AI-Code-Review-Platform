import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

interface OtpEntry {
  code: string;
  expiresAt: number;
  verified: boolean;
}

@Injectable()
export class OtpService {
  private otpStore = new Map<string, OtpEntry>();
  private readonly OTP_LENGTH = 6;
  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

  private lastSentAt = new Map<string, number>();

  constructor(private readonly configService: ConfigService) {}

  async sendOtp(email: string): Promise<{ message: string }> {
    // Rate limit: 1 OTP per minute
    const lastSent = this.lastSentAt.get(email);
    if (lastSent && Date.now() - lastSent < this.RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((this.RESEND_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
      throw new BadRequestException(`Please wait ${waitSec}s before requesting another code`);
    }

    // Generate OTP
    const code = this.generateCode();
    const expiresAt = Date.now() + this.OTP_TTL_MS;

    this.otpStore.set(email, { code, expiresAt, verified: false });
    this.lastSentAt.set(email, Date.now());

    // Send email
    await this.sendEmail(email, code);

    return { message: 'OTP sent successfully' };
  }

  verifyOtp(email: string, code: string): { verified: boolean; otpToken: string } {
    const entry = this.otpStore.get(email);

    if (!entry) {
      throw new BadRequestException('No OTP found. Please request a new code');
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP has expired. Please request a new code');
    }

    if (entry.code !== code) {
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark as verified
    entry.verified = true;
    this.otpStore.set(email, entry);

    // Generate otpToken (HMAC-signed token for stateless verification)
    const otpToken = this.generateOtpToken(email, code);

    return { verified: true, otpToken };
  }

  verifyOtpToken(email: string, otpToken: string): boolean {
    try {
      const secret = this.configService.get<string>('jwt.secret') || 'fallback-secret';
      const [encodedEmail, providedCode, signature] = otpToken.split('.');

      if (!encodedEmail || !providedCode || !signature) return false;

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${encodedEmail}.${providedCode}`)
        .digest('hex');

      if (signature !== expectedSignature) return false;

      const decodedEmail = Buffer.from(encodedEmail, 'base64url').toString();

      if (decodedEmail !== email) return false;

      const entry = this.otpStore.get(email);
      if (!entry || !entry.verified || entry.code !== providedCode) return false;

      if (Date.now() > entry.expiresAt) {
        this.otpStore.delete(email);
        return false;
      }

      // Clean up
      this.otpStore.delete(email);
      return true;
    } catch {
      return false;
    }
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      code += crypto.randomInt(0, 10).toString();
    }
    return code;
  }

  private generateOtpToken(email: string, code: string): string {
    const secret = this.configService.get<string>('jwt.secret') || 'fallback-secret';
    const encodedEmail = Buffer.from(email).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedEmail}.${code}`)
      .digest('hex');
    return `${encodedEmail}.${code}.${signature}`;
  }

  private async sendEmail(to: string, code: string): Promise<void> {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port');
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');
    const from = this.configService.get<string>('smtp.from');

    if (!host || !user || !pass) {
      console.warn('[OTP] SMTP not configured. OTP code:', code);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: from || `AI Code Review <${user}>`,
      to,
      subject: 'Your AI Code Review Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #714cb6; font-size: 24px; margin: 0;">AI Code Review</h1>
          </div>
          <div style="background: #f8f5ff; border-radius: 12px; padding: 32px; text-align: center;">
            <h2 style="color: #292827; font-size: 18px; margin: 0 0 16px;">Verification Code</h2>
            <p style="color: #666; font-size: 14px; margin: 0 0 24px;">Enter this code to complete your registration:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #714cb6; padding: 16px; background: white; border-radius: 8px; display: inline-block;">${code}</div>
            <p style="color: #999; font-size: 12px; margin: 24px 0 0;">This code expires in 5 minutes.</p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  }
}
