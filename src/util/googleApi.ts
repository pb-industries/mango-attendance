import { google, Auth, sheets_v4 } from "googleapis";

let client:
  | Auth.Compute
  | Auth.JWT
  | Auth.Impersonated
  | Auth.UserRefreshClient
  | Auth.BaseExternalAccountClient
  | null = null;

const init = async (): Promise<void> => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "../secrets.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  client = await auth.getClient();
};

export const getClient = async (): Promise<sheets_v4.Sheets> => {
  if (!client) {
    await init();
  }

  if (!client) {
    throw new Error("Could not instantiate google client");
  }

  return google.sheets({ version: "v4", auth: client });
};
