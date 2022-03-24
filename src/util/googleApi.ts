import { google, Auth, sheets_v4 } from 'googleapis';
import fs from 'fs';

let client:
  | Auth.Compute
  | Auth.JWT
  | Auth.Impersonated
  | Auth.UserRefreshClient
  | Auth.BaseExternalAccountClient
  | null = null;

let auth: Auth.GoogleAuth | null;

export const getKeyFile = () => {
  if (!fs.existsSync('./googleKey.json')) {
    var json = null;
    try {
      json = JSON.parse(process.env.GOOGLE_SHEET_KEY_FILE as string);
    } catch (e) {
      json = process.env.GOOGLE_SHEET_KEY_FILE;
    }

    console.log(json);
    fs.writeFileSync('./googleKey.json', JSON.stringify(json));
  }

  return './googleKey.json';
};

const init = async (): Promise<void> => {
  if (!auth) {
    auth = new google.auth.GoogleAuth({
      keyFile: await getKeyFile(),
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
