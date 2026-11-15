import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PrincipalApiClient {
  constructor(private readonly configService: ConfigService) {}

  async getCanteiroFormularios(
    canteiroId: string,
    accessToken: string,
  ): Promise<unknown> {
    const configuredBaseUrl = this.configService
      .getOrThrow<string>('API_PRINCIPAL')
      .replace(/\/+$/, '');
    const apiBaseUrl = /\/api$/i.test(configuredBaseUrl)
      ? configuredBaseUrl
      : `${configuredBaseUrl}/api`;
    const url = `${apiBaseUrl}/canteiros/${encodeURIComponent(canteiroId)}/formularios`;
    const token = accessToken.startsWith('Bearer ')
      ? accessToken
      : `Bearer ${accessToken}`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: token,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(
          'Falha ao consultar os formulários na API principal.',
          error.response?.status ?? 502,
          { cause: error },
        );
      }

      throw new BadGatewayException(
        'Falha inesperada ao consultar a API principal.',
        { cause: error },
      );
    }
  }
}
