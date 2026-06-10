import fs from 'fs';
import path from 'path';

export interface ChatMessage {
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  email: string;
  username: string;
  status: 'bot' | 'waiting' | 'active' | 'closed';
  updatedAt: number;
  messages: ChatMessage[];
}

export interface SupportConfig {
  openRouterApiKey: string;
  aiModel: string;
  systemPrompt: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const CHATS_FILE = path.join(DB_DIR, 'support_chats.json');
const CONFIG_FILE = path.join(DB_DIR, 'support_config.json');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

export function getSupportConfig(): SupportConfig {
  ensureDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig: SupportConfig = {
      openRouterApiKey: "",
      aiModel: "google/gemini-2.5-flash",
      systemPrompt: "You are the premium customer support AI for AuraPlay, a luxury cloud-native gaming renting and casino betting hub. Your tone should be extremely professional, helpful, and polite (like a top 1% wealth management company). Assist the user with general inquiries. If the user explicitly asks to speak to customer support, a real agent, or wants to deposit/withdraw help that requires human review, politely guide them to wait and trigger the chat transfer to our human support desk."
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    return defaultConfig;
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read support config", err);
    return {
      openRouterApiKey: "",
      aiModel: "google/gemini-2.5-flash",
      systemPrompt: "You are the premium customer support AI for AuraPlay."
    };
  }
}

export function saveSupportConfig(config: SupportConfig) {
  ensureDir();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to save support config", err);
  }
}

export function getChatSessions(): ChatSession[] {
  ensureDir();
  if (!fs.existsSync(CHATS_FILE)) {
    fs.writeFileSync(CHATS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const data = fs.readFileSync(CHATS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read chat sessions", err);
    return [];
  }
}

export function saveChatSessions(sessions: ChatSession[]) {
  ensureDir();
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to save chat sessions", err);
  }
}

export function getChatByEmail(email: string): ChatSession | undefined {
  const sessions = getChatSessions();
  return sessions.find(s => s.email.toLowerCase() === email.toLowerCase());
}

export function addMessageToChat(email: string, username: string, sender: 'user' | 'bot' | 'admin', text: string): ChatSession {
  const sessions = getChatSessions();
  const index = sessions.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
  
  const newMessage: ChatMessage = {
    sender,
    text,
    timestamp: Date.now()
  };

  if (index !== -1) {
    const session = sessions[index];
    session.messages.push(newMessage);
    session.updatedAt = Date.now();
    session.username = username; // Update username just in case
    // Auto-update status if user sends a message and it was closed
    if (session.status === 'closed') {
      session.status = 'bot';
    }
    saveChatSessions(sessions);
    return session;
  } else {
    const newSession: ChatSession = {
      email,
      username,
      status: 'bot',
      updatedAt: Date.now(),
      messages: [newMessage]
    };
    sessions.push(newSession);
    saveChatSessions(sessions);
    return newSession;
  }
}

export function updateChatStatus(email: string, status: 'bot' | 'waiting' | 'active' | 'closed'): ChatSession | null {
  const sessions = getChatSessions();
  const index = sessions.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
  
  if (index !== -1) {
    sessions[index].status = status;
    sessions[index].updatedAt = Date.now();
    saveChatSessions(sessions);
    return sessions[index];
  }
  return null;
}
