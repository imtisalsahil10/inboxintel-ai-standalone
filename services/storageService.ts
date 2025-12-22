import { Email } from '../types';

const DB_KEY = 'inbox_intel_db_v1';

/**
 * Persists application data locally in the browser.
 */
export const db = {
  saveEmails: (emails: Email[]) => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(emails));
    } catch (error) {
      console.error('[Storage] Save failed:', error);
    }
  },

  getEmails: (): Email[] | null => {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[Storage] Read failed:', error);
      return null;
    }
  },

  clear: () => {
    localStorage.removeItem(DB_KEY);
  }
};
