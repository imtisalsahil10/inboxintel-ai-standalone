import { Email } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AuthStatus {
  isConfigured: boolean;
  isAuthenticated: boolean;
  isOffline: boolean;
  userEmail: string;
}

export const checkBackendAuthStatus = async (): Promise<AuthStatus> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/status`, { credentials: 'include' });
    if (!response.ok) {
        return {
            isConfigured: false,
            isAuthenticated: false,
            isOffline: true,
            userEmail: ""
        };
    }
    const data = await response.json();
    return {
        isConfigured: data.isConfigured,
        isAuthenticated: data.isAuthenticated,
        isOffline: false,
        userEmail: data.userEmail || ""
    };
  } catch (error) {
    console.error("Backend check failed:", error);
    return {
        isConfigured: false,
        isAuthenticated: false,
        isOffline: true,
        userEmail: ""
    };
  }
};

export const loginToBackend = () => {
    window.location.href = `${API_BASE_URL}/auth`;
};

export const logoutFromBackend = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, { 
            method: 'POST',
            credentials: 'include'
        });
        return response.ok;
    } catch (error) {
        console.error("Logout failed:", error);
        return false;
    }
};

const mapBackendEmail = (e: any): Omit<Email, 'analysis'> => {
    let sender = e.sender || e.from || "Unknown";
    let senderName = e.senderName || sender;
    
    // Client-side parsing fallback if backend didn't do it (for old data)
    if (e.from && (!e.senderName || e.senderName === e.from)) {
        const match = e.from.match(/(.*)<(.*)>/);
        if (match) {
            senderName = match[1].trim().replace(/^"|"$/g, '');
            sender = match[2].trim();
        } else if (e.from.includes('@')) {
             senderName = e.from.split('@')[0];
             sender = e.from;
        }
    }

    return {
        ...e,
        sender,
        senderName,
        receivedAt: e.timestamp || e.date || new Date().toISOString()
    };
};

export const fetchEmailsFromBackend = async (): Promise<Omit<Email, 'analysis'>[]> => {
    const response = await fetch(`${API_BASE_URL}/emails`, { credentials: 'include' });
    if (!response.ok) throw new Error("Failed to fetch emails");
    const data = await response.json();
    return (data.messages || []).map(mapBackendEmail);
};

export const syncEmailsWithBackend = async (): Promise<Omit<Email, 'analysis'>[]> => {
    const response = await fetch(`${API_BASE_URL}/sync`, { 
        method: 'POST',
        credentials: 'include'
    });
    if (!response.ok) throw new Error("Failed to sync emails");
    const data = await response.json();
    return (data.messages || []).map(mapBackendEmail);
}

export const searchEmailsOnBackend = async (query: string): Promise<Omit<Email, 'analysis'>[]> => {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
    if (!response.ok) throw new Error("Failed to search emails");
    const data = await response.json();
    return (data.messages || []).map(mapBackendEmail);
};

export const sendReply = async (to: string, subject: string, body: string, threadId?: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ to, subject, body, threadId })
        });
        return response.ok;
    } catch (error) {
        console.error("Send failed:", error);
        return false;
    }
};
