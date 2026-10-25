import axios from 'axios';
import type { ConfigService } from '@nestjs/config';
import { PrincipalApiClient } from './principal-api.client';

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

describe('PrincipalApiClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests the canteiro forms endpoint with a bearer token', async () => {
    const responseData = [{ id: 'form-1' }];
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('https://principal.example/api/'),
    } as unknown as ConfigService;
    const getSpy = jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ data: responseData });
    const client = new PrincipalApiClient(configService);

    await expect(
      client.getCanteiroFormularios('canteiro 1', 'access-token'),
    ).resolves.toEqual(responseData);

    expect(getSpy).toHaveBeenCalledWith(
      'https://principal.example/api/canteiros/canteiro%201/formularios',
      {
        headers: {
          Authorization: 'Bearer access-token',
        },
      },
    );
  });
});
