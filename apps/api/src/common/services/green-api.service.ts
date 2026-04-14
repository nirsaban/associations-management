import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Green API WhatsApp Integration Service
 *
 * Sends OTP codes via WhatsApp using Green API
 * Docs: https://green-api.com/en/docs/
 */
@Injectable()
export class GreenApiService {
  private readonly logger = new Logger(GreenApiService.name);
  private readonly instanceId: string;
  private readonly token: string;
  private readonly baseUrl: string | null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.instanceId = this.configService.get<string>('GREEN_API_INSTANCE_ID') || '';
    this.token = this.configService.get<string>('GREEN_API_TOKEN') || '';
    this.enabled = this.configService.get<string>('GREEN_API_ENABLED') === 'true';

    if (this.enabled && this.instanceId && this.token) {
      this.baseUrl = `https://api.green-api.com/waInstance${this.instanceId}`;
      this.logger.log('Green API service initialized');
    } else {
      this.baseUrl = null;
      this.logger.warn('Green API not configured - OTP will be logged to console only');
    }
  }

  /**
   * Send OTP code via WhatsApp
   * @param phone Israeli phone number (format: 05XXXXXXXX)
   * @param otp 6-digit OTP code
   */
  async sendOtpSms(phone: string, otp: string): Promise<void> {
    const message = `קוד האימות שלך: ${otp}\n\nהקוד תקף ל-5 דקות.\n\n🔐 ניהול עמותות`;

    // If Green API is not enabled, just log the OTP
    if (!this.enabled) {
      this.logger.log(`[DEV MODE] OTP for ${this.maskPhone(phone)}: ${otp}`);
      return;
    }

    try {
      // Format phone for WhatsApp: remove leading 0, add 972 (Israel country code)
      const formattedPhone = this.formatPhoneForWhatsApp(phone);

      const endpoint = `${this.baseUrl}/sendMessage/${this.token}`;

      const response = await axios.post(endpoint, {
        chatId: `${formattedPhone}@c.us`, // WhatsApp chat ID format
        message,
      });

      if (!response.data.idMessage) {
        throw new Error('Failed to send OTP via Green API - no message ID returned');
      }

      this.logger.log(`OTP sent via WhatsApp to ${this.maskPhone(phone)} - Message ID: ${response.data.idMessage}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP via Green API to ${this.maskPhone(phone)}`, error);

      // Fallback: log to console in development
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[FALLBACK] OTP for ${this.maskPhone(phone)}: ${otp}`);
      }

      throw error;
    }
  }

  /**
   * Format Israeli phone number for WhatsApp
   * @param phone Israeli phone (05XXXXXXXX)
   * @returns WhatsApp format (972XXXXXXXXX)
   */
  private formatPhoneForWhatsApp(phone: string): string {
    // Remove leading 0 and add Israel country code 972
    if (phone.startsWith('0')) {
      return `972${phone.substring(1)}`;
    }
    return phone;
  }

  /**
   * Mask phone number for logging (shows only last 4 digits)
   * @param phone Phone number
   * @returns Masked phone (e.g., "****7890")
   */
  private maskPhone(phone: string): string {
    if (phone.length < 4) return '****';
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }
}
