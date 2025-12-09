import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CardConnectConfig {
  apiUrl: string;
  username: string;
  password: string;
  mid: string;
  isProduction: boolean;
}

export interface CardConnectChargeRequest {
  amount: string;
  currency: string;
  account: string;
  expiry?: string;
  cvv?: string;
  cardType?: string;
  name?: string;
  address?: string;
  city?: string;
  region?: string;
  postal?: string;
  email?: string;
  invoiceid?: string;
  orderid?: string;
}

export interface CardConnectResponse {
  respstat?: string;
  respcode?: string;
  resptext?: string;
  respmsg?: string;
  retref?: string;
  amount?: string;
  merchantid?: string;
  account?: string;
  token?: string;
  expiry?: string;
  name?: string;
  bintype?: string;
  entrymode?: string;
  authcode?: string;
  cvvresp?: string;
  avsresp?: string;
  orderid?: string;
  invoiceid?: string;
  commcard?: string;
  emv?: string;
}

@Injectable()
export class CardConnectService {
  private config: CardConnectConfig;

  constructor(private configService: ConfigService) {
    const isProduction =
      this.configService.get<string>('CARDCONNECT_PRODUCTION') === 'true';

    this.config = isProduction
      ? {
          apiUrl:
            this.configService.get<string>('CARDCONNECT_API_URL') || '',
          username: this.configService.get<string>('CARDCONNECT_USERNAME') || '',
          password: this.configService.get<string>('CARDCONNECT_PASSWORD') || '',
          mid: this.configService.get<string>('CARDCONNECT_MID') || '',
          isProduction: true,
        }
      : this.getSandboxConfig();
  }

  private getAuthHeader(): string {
    const credentials = `${this.config.username}:${this.config.password}`;
    const base64 = Buffer.from(credentials).toString('base64');
    return `Basic ${base64}`;
  }

  async authorize(
    request: CardConnectChargeRequest,
  ): Promise<CardConnectResponse> {
    const url = `${this.config.apiUrl}auth`;

    const payload = {
      merchantid: this.config.mid,
      amount: request.amount,
      currency: request.currency || 'USD',
      account: request.account,
      expiry: request.expiry,
      cvv: request.cvv,
      name: request.name,
      address: request.address,
      city: request.city,
      region: request.region,
      postal: request.postal,
      email: request.email,
      invoiceid: request.invoiceid,
      orderid: request.orderid,
      capture: 'Y',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CardConnect API error: ${response.status} - ${errorText}`,
        );
      }

      const data: CardConnectResponse = await response.json();
      return data;
    } catch (error) {
      console.error('CardConnect authorization error:', error);
      throw error;
    }
  }

  async refund(retref: string, amount?: string): Promise<CardConnectResponse> {
    const url = `${this.config.apiUrl}refund`;

    const payload: any = {
      merchantid: this.config.mid,
      retref: retref,
    };

    if (amount) {
      payload.amount = amount;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CardConnect refund error: ${response.status} - ${errorText}`,
        );
      }

      const data: CardConnectResponse = await response.json();
      return data;
    } catch (error) {
      console.error('CardConnect refund error:', error);
      throw error;
    }
  }

  async voidTransaction(retref: string): Promise<CardConnectResponse> {
    const url = `${this.config.apiUrl}void`;

    const payload = {
      merchantid: this.config.mid,
      retref: retref,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CardConnect void error: ${response.status} - ${errorText}`,
        );
      }

      const data: CardConnectResponse = await response.json();
      return data;
    } catch (error) {
      console.error('CardConnect void error:', error);
      throw error;
    }
  }

  async inquire(retref: string): Promise<CardConnectResponse> {
    const url = `${this.config.apiUrl}inquire/${retref}/${this.config.mid}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CardConnect inquire error: ${response.status} - ${errorText}`,
        );
      }

      const data: CardConnectResponse = await response.json();
      return data;
    } catch (error) {
      console.error('CardConnect inquire error:', error);
      throw error;
    }
  }

  getCardConnectStatus(response: CardConnectResponse): {
    status: 'succeeded' | 'pending' | 'failed';
    message: string;
  } {
    if (response.respstat === 'A') {
      return {
        status: 'succeeded',
        message:
          response.resptext || response.respmsg || 'Payment approved',
      };
    } else if (response.respstat === 'B') {
      return {
        status: 'pending',
        message: response.resptext || 'Payment retry required',
      };
    } else {
      return {
        status: 'failed',
        message: response.resptext || response.respmsg || 'Payment declined',
      };
    }
  }

  private getSandboxConfig(): CardConnectConfig {
    return {
      apiUrl: 'https://fts-uat.cardconnect.com/cardconnect/rest/',
      username: 'testing',
      password: 'testing123',
      mid: '800000019079',
      isProduction: false,
    };
  }
}







