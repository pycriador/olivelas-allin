import { google } from 'googleapis';
import type { GoogleAuthStatus } from '../../../src/types/spreadsheet';

/**
 * Minimum required Google API Scopes for Google Drive, Google Sheets, and Google Forms:
 * - https://www.googleapis.com/auth/drive.readonly: Read-only access to file metadata and file downloads (XLSX, CSV)
 * - https://www.googleapis.com/auth/spreadsheets.readonly: Read-only access to Google Sheets metadata and grid values
 * - https://www.googleapis.com/auth/forms.body.readonly: Read-only access to Google Forms structure, items, and metadata
 * - https://www.googleapis.com/auth/forms.responses.readonly: Read-only access to Google Forms responses
 */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
];

export interface GoogleCredentialsConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

/**
 * Normalizes Google Private Key string:
 * - Replaces escaped literal "\n" sequences with real newlines
 * - Cleans leading/trailing double quotes or whitespace
 */
export function normalizePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let cleaned = key.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n');
}

/**
 * Loads credentials from custom parameters or environment variables securely.
 * Supports custom credentials, full JSON string or individual environment variables.
 */
export function loadGoogleCredentials(customCreds?: GoogleCredentialsConfig | null): GoogleCredentialsConfig | null {
  // Option 0: Custom user-provided credentials
  if (customCreds && customCreds.clientEmail && customCreds.privateKey) {
    return {
      projectId: customCreds.projectId,
      clientEmail: customCreds.clientEmail.trim(),
      privateKey: normalizePrivateKey(customCreds.privateKey),
    };
  }

  // Option 1: Full JSON string
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      return {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey),
      };
    } catch {
      // Avoid logging secret content
      console.error('[Google Auth] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: invalid JSON format');
      return null;
    }
  }

  // Option 2: Individual variables
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  return null;
}

/**
 * Checks whether Google Service Account is configured without exposing private keys
 */
export function getGoogleConfigStatus(customCreds?: GoogleCredentialsConfig | null): GoogleAuthStatus {
  const creds = loadGoogleCredentials(customCreds);
  if (!creds || !creds.clientEmail || !creds.privateKey) {
    return {
      configured: false,
    };
  }

  return {
    configured: true,
    clientEmail: creds.clientEmail,
    projectId: creds.projectId,
  };
}

/**
 * Creates an authenticated Google JWT Auth Client using the configured Service Account
 */
export async function getAuthenticatedGoogleClient(customCreds?: GoogleCredentialsConfig | null) {
  const creds = loadGoogleCredentials(customCreds);
  if (!creds || !creds.clientEmail || !creds.privateKey) {
    throw new Error(
      'Google credentials not configured. Please set your Google Service Account in settings or via environment variables.'
    );
  }

  const auth = new google.auth.JWT({
    email: creds.clientEmail,
    key: creds.privateKey,
    scopes: GOOGLE_SCOPES,
  });

  // Verify and authorize token
  await auth.authorize();
  return auth;
}
