import { prisma } from './prisma';

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

export async function getSupportConfig(): Promise<SupportConfig> {
  try {
    const config = await prisma.supportConfig.findUnique({
      where: { id: 'default' }
    });
    
    if (!config) {
      const defaultConfig: SupportConfig = {
        openRouterApiKey: "",
        aiModel: "google/gemini-2.5-flash",
        systemPrompt: "You are the premium customer support AI for AuraPlay, a luxury cloud-native gaming renting and casino betting hub. Your tone should be extremely professional, helpful, and polite (like a top 1% wealth management company). Assist the user with general inquiries. If the user explicitly asks to speak to customer support, a real agent, or wants to deposit/withdraw help that requires human review, politely guide them to wait and trigger the chat transfer to our human support desk."
      };
      await prisma.supportConfig.create({
        data: {
          id: 'default',
          openRouterApiKey: defaultConfig.openRouterApiKey,
          aiModel: defaultConfig.aiModel,
          systemPrompt: defaultConfig.systemPrompt
        }
      });
      return defaultConfig;
    }
    
    return {
      openRouterApiKey: config.openRouterApiKey,
      aiModel: config.aiModel,
      systemPrompt: config.systemPrompt
    };
  } catch (err) {
    console.error("Failed to read support config from DB", err);
    return {
      openRouterApiKey: "",
      aiModel: "google/gemini-2.5-flash",
      systemPrompt: "You are the premium customer support AI for AuraPlay."
    };
  }
}

export async function saveSupportConfig(config: SupportConfig): Promise<void> {
  try {
    await prisma.supportConfig.upsert({
      where: { id: 'default' },
      update: {
        openRouterApiKey: config.openRouterApiKey,
        aiModel: config.aiModel,
        systemPrompt: config.systemPrompt
      },
      create: {
        id: 'default',
        openRouterApiKey: config.openRouterApiKey,
        aiModel: config.aiModel,
        systemPrompt: config.systemPrompt
      }
    });
  } catch (err) {
    console.error("Failed to save support config to DB", err);
  }
}

export async function getChatSessions(): Promise<ChatSession[]> {
  try {
    const chats = await prisma.supportChat.findMany({
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return chats.map(c => ({
      email: c.email,
      username: c.username,
      status: c.status as any,
      updatedAt: c.updatedAt,
      messages: c.messages.map(m => ({
        sender: m.sender as any,
        text: m.text,
        timestamp: m.timestamp
      }))
    }));
  } catch (err) {
    console.error("Failed to read chat sessions from DB", err);
    return [];
  }
}

export async function getChatByEmail(email: string): Promise<ChatSession | undefined> {
  try {
    const chat = await prisma.supportChat.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });
    
    if (!chat) return undefined;
    
    return {
      email: chat.email,
      username: chat.username,
      status: chat.status as any,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map(m => ({
        sender: m.sender as any,
        text: m.text,
        timestamp: m.timestamp
      }))
    };
  } catch (err) {
    console.error("Failed to get chat by email from DB", err);
    return undefined;
  }
}

export async function addMessageToChat(email: string, username: string, sender: 'user' | 'bot' | 'admin', text: string): Promise<ChatSession> {
  try {
    const emailLower = email.toLowerCase();
    
    // 1. Upsert SupportChat session
    const chat = await prisma.supportChat.upsert({
      where: { email: emailLower },
      update: {
        username,
        updatedAt: Date.now()
      },
      create: {
        email: emailLower,
        username,
        updatedAt: Date.now(),
        status: 'bot'
      }
    });
    
    if (chat.status === 'closed') {
      await prisma.supportChat.update({
        where: { email: emailLower },
        data: { status: 'bot' }
      });
    }

    // 2. Create the message
    await prisma.supportMessage.create({
      data: {
        sender,
        text,
        timestamp: Date.now(),
        chatId: chat.id
      }
    });

    const updatedSession = await getChatByEmail(emailLower);
    if (!updatedSession) throw new Error("Failed to retrieve updated chat session");
    return updatedSession;
  } catch (err) {
    console.error("Failed to add message to chat in DB", err);
    throw err;
  }
}

export async function updateChatStatus(email: string, status: 'bot' | 'waiting' | 'active' | 'closed'): Promise<ChatSession | null> {
  try {
    const emailLower = email.toLowerCase();
    await prisma.supportChat.update({
      where: { email: emailLower },
      data: {
        status,
        updatedAt: Date.now()
      }
    });
    return await getChatByEmail(emailLower) || null;
  } catch (err) {
    console.error("Failed to update chat status in DB", err);
    return null;
  }
}
