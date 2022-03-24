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
    const creds = JSON.parse(
      (process.env.GOOGLE_SHEET_KEY_FILE as string).replace(/\\n/g, '')
    );
    console.log(creds);
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
