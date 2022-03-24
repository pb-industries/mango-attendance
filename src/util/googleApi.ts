import { google, Auth, sheets_v4 } from 'googleapis';
import { log } from '@/logger';

let client:
  | Auth.Compute
  | Auth.JWT
  | Auth.Impersonated
  | Auth.UserRefreshClient
  | Auth.BaseExternalAccountClient
  | null = null;

let auth: Auth.GoogleAuth | null;

export const getKeyFile = () => {
  var json: Auth.CredentialBody = {};
  try {
    json = JSON.parse(
      Buffer.from(process.env.GOOGLE_SHEET_KEY_FILE as string).toString('utf8')
    );
  } catch (e) {
    json = process.env.GOOGLE_SHEET_KEY_FILE as {};
  }

  if (!json?.private_key || !json?.client_email) {
    throw new Error('Invalid Auth credentials');
  }

  return json;
};

const init = async (): Promise<void> => {
  if (!auth) {
    const credentials = getKeyFile();
    log.info('creds', credentials);
    auth = new google.auth.GoogleAuth({
      credentials,
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
