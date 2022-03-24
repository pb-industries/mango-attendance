import { google, Auth, sheets_v4 } from 'googleapis';

let client:
  | Auth.Compute
  | Auth.JWT
  | Auth.Impersonated
  | Auth.UserRefreshClient
  | Auth.BaseExternalAccountClient
  | null = null;

let auth: Auth.GoogleAuth | null;

const init = async (): Promise<void> => {
  if (!auth) {
    const creds = {
      type: 'service_account',
      project_id: 'bnc-attendance',
      private_key_id: '60cef309f165df9e9480c1a1b2b3bc4248c723c8',
      private_key:
        '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCx0SFhzwlM1EjG\nfgX7JyOKc1fmSAT8fighIiqWqBOIAZetl+P9BrTeagJymTcpwwWk2cCCLJah3vyO\nE2DtSzSQMAuPkUYyCI4heYAneCfDoUS1Ym7bNTL4DSKtLgHd82oO7dK0aa5fIPTB\n3DpOMegrEEQsMzwOvy0GvOUZSbbH9mDqzjLM/nnMQWa19wR2JQsAmUSeV9O4Xr/r\nErlAtkw5RJoPagpdBoEOozBsexJOCVO+Itb2PDJSBDSaTsm9LgqL4oXP4/iJ3OPm\nMUHfxIip0MA0lYv3Yuaq9TT6O+ZgNyph9boUVoPZN9XC+WGbZv/BJkKUDhlOUeZ8\nx71lVlynAgMBAAECggEAVMhyMkCVHpzZVksgbu/qckks0A/m0L0WRTYVOGBLb73S\npGKXwj1AYAwLvrhvJOpn9oIc1/SKngPER7nVrU7+cQF3gayy24hYvH1CLY+M5iou\nqI2Wbc6fzsX0kr4tBbbaCuQ6YutAyPrduNFYu4/wMxg+aRTEvgNJZL0MP1J2ZEC5\nlX9Wpgjue/5TPdnrztddb9aDZrTvDxJxJxLmOB448aVdh7w5RJmNQp88Rlb05tTx\nCATi1McS6lWuRYPmlLKPFdguUDUKm/6WS4vUKMMv+W/ilj2x/SS9pt/XGqmxuZ5j\nZ/cL7cVL3qHAUJw0nfzkVpkpTKhaKMeE0uTBlFNVgQKBgQDhCYdF9cPmnp/rI1pm\n5PWGV71nvQ9gNCtfndN2XcSnsi71h6mAbyTsUcIg99FVc0Pofun7+h4YPltYO9tE\nT8IASABNGHFR1tHpBc4qV4h5tG5LWDMHNNlfUjYUUMgDW4EPysrFvR4AzE/pRcXI\nUuDXXvY6bcBPwI7/f71J6reI7QKBgQDKSF09is/4M2yp4BqBLpZQ0uc9glABtLAp\nscCo6Gm0IJfxf4uS947aoo+Jk7PesQHIVsShGWYAgSwiAxIHhRKcvoPw0NmXfE6Z\nRQoXO34NJqwGcOWIFEa4aBqB1mgegHNG+YYF/0F6PGBlMdvc9+WyQGOtqA9WUyeX\nd+puSt3tYwKBgGNWk3JclQe+yhVAW+3D8GZHYQLkQF9VaDgjMW+04NSuIXCdXEOn\nzILNbIalHrE72qRNMfjbZmGJVUVT1u0G0DrTjd56hbt8utjEiUfDsCkZbv6vhocN\n207quZiqOEDTKdvQx0YWv6HWjwgIltBhVYN9FfCg9h2+gOFkgCibBj3ZAoGAIe/A\nDNokB/0ApwNdDv005LxtZSleqNqaj3Qt4WiUi07IjxCZ5v83bUDGmgs4qwzBQs4j\n0O9E6KLDN7WSKcbOl5Ny6UzwpHSLbzVg+wLVI/mv9KiuKYVVVAzLHatN7ogYTvj/\n3jOz1YEZnwCdZVYFqEEbOAAxCoeK5eONZhGTaAcCgYA5s86T2EXQAhXsvjEY3XW8\n+A9shMPaoITmffn1PyuM6irfLPf0uGdXYvicdhPQZapXKDG+OTNWtlDZHVGTrS10\nY8FKh8/rk0SdQQuyPirfoXMTmrNKocoPPZSEbdQ9PhtKUVfueBcT6F5XYhUgiarK\nRwcNRwJfbpJW7ht4eT5FIw==\n-----END PRIVATE KEY-----\n',
      client_email: 'node-app@bnc-attendance.iam.gserviceaccount.com',
      client_id: '113961483623739022412',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url:
        'https://www.googleapis.com/robot/v1/metadata/x509/node-app%40bnc-attendance.iam.gserviceaccount.com',
    };

    auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  if (!client) {
    client = await auth.getClient();
  }
};

/**
 * Initialise and return a handle to the Sheets API so we can
 * read and write data.
 *
 * @returns {Promise<sheets_v4.Sheets>}
 */
export const getSheets = async (): Promise<sheets_v4.Sheets> => {
  await init();

  if (!client || !auth) {
    throw new Error('Could not instantiate google client');
  }

  return google.sheets({ version: 'v4', auth: client });
};
