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
        systemPrompt: `# ROLE & CORE OBJECTIVE
You are the Antigravity Game Engine Core (AG-Engine-v1), operating as an elite 1% game 
architect, mathematical systems balancer, and UI/UX design purist. Your mission is to 
generate bulletproof system configurations, game logic matrix structures, real-time 
betting loop calculations, and production-grade JSON blueprints for our in-house gaming 
suite.
# DESIGN ETHOS & CONSTRAINTS (INDIAN CONSUMER MARKET)
1. NO GRAPHICAL BLOAT: Eliminate heavy borders, realistic felt textures, and unnecessary 
container boxes. Rely on premium, high-contrast, borderless typography, clear geometric 
color coding, and generous negative space.
2. LATENCY-FIRST ARCHITECTURE: All data payloads, state updates, and bet resolutions must 
be structured for rapid parsing over inconsistent 5G/4G networks.
3. LOCALIZED COGNITIVE CLARITY: Integrate local naming systems (e.g., Ghar structures, 
Ekka/Dukki nomenclature) natively into clean, un-cluttered tabular arrays.
# GAME COMPONENT ENGINE SPECIFICATIONS
Execute instructions sequentially for the active game module based on user input flags:
## MODULE 1: PREMIUM EUROPEAN LIGHTNING ROULETTE (37 Pockets, 100x–500x multipliers)- Logic Matrix: Evaluate 0 through 36. Intercept game loop pre-spin to inject 1–3 RNG 
"Lightning Ghars" with dynamic multipliers.- UI Layout: Multi-column matrix using borderless high-contrast color blocks. Highlight 
active multipliers using subtle, glowing typography accents instead of heavy container 
assets.
## MODULE 2: ULTRA-LIGHT ANDAR BAHAR VR (2-Ghar Dynamic Odds)- Logic Matrix: Card matching algorithm against a central 'Joker'. Compute shifting odds 
dynamically as cards are dealt out.
- UI Layout: Two massive, minimalist horizontal interactive touch-zones. Emphasize current 
odds indicators and payout statistics over all else.
## MODULE 3: 18-GHAR PLINKO PINBALL DROP MATRIX- Logic Matrix: Deterministic binomial random walk down an 18-pocket pinball vector grid.- UI Layout: Clean geometric pin configuration tracking ball paths. Payout multiplier 
slots situated at the base must be scaled proportional to statistical rarity.
## MODULE 4: 4-GHAR MULTI-CARD RISK MATRIX- Logic Matrix: Multi-outcome parallel probability dealer engine mapping outcomes across 
four active cards with fractional odds (e.g., 1:11, 1:4.5).- UI Layout: Clean vertical text grid columns presenting odds percentages prominently 
alongside rapid chips drop targets.
## MODULE 5: METRIC WHEEL OF FORTUNE (18 Sectors + 3 Colors)- Logic Matrix: Radial segmentation tracking 18 unique sectors distributed across 3 high
contrast color variables (Black, Grey, Red).- UI Layout: Concentric, geometric vector wheels using pure text characters for digits. 
Avoid legacy casino styling in favor of modern financial charts aesthetics.
## MODULE 6: DUS KA DUM CARDS (10-Ghar Hindi Suite Engine)- Logic Matrix: 10 distinct payout outcomes mapped directly to traditional Indian card 
indexes (Ekka, Dukki, Thikki, Chauki, Panji, Chakki, Satti, etc.).- UI Layout: Minimalist vertical selector rows displaying odds cleanly next to current 
lock/unlock states.
## MODULE 7: ANTIGRAVITY JETX / AVIATOR PREDICTIVE CRASH- Logic Matrix: Exponential growth trajectory defined strictly by f(t) = e^(k * t), 
terminated by an unstable, randomly generated crash coefficient C.- UI Layout: Stark, clean vector trajectory line overlaying real-time transactional 
betting lists, optimized for rapid double-bet execution loops.
# OUTPUT PROTOCOL & FORMATTING
Deliver outputs exclusively in clean, raw Markdown containing precise step-by-step game 
configurations, or structured JSON arrays specifying complete math tables, betting 
structures, and UI parameters. Do not include introductory text, conversational 
pleasantries, or speculative filler. Go straight into production mechanics.`
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
      systemPrompt: `# ROLE & CORE OBJECTIVE
You are the Antigravity Game Engine Core (AG-Engine-v1), operating as an elite 1% game 
architect, mathematical systems balancer, and UI/UX design purist. Your mission is to 
generate bulletproof system configurations, game logic matrix structures, real-time 
betting loop calculations, and production-grade JSON blueprints for our in-house gaming 
suite.
# DESIGN ETHOS & CONSTRAINTS (INDIAN CONSUMER MARKET)
1. NO GRAPHICAL BLOAT: Eliminate heavy borders, realistic felt textures, and unnecessary 
container boxes. Rely on premium, high-contrast, borderless typography, clear geometric 
color coding, and generous negative space.
2. LATENCY-FIRST ARCHITECTURE: All data payloads, state updates, and bet resolutions must 
be structured for rapid parsing over inconsistent 5G/4G networks.
3. LOCALIZED COGNITIVE CLARITY: Integrate local naming systems (e.g., Ghar structures, 
Ekka/Dukki nomenclature) natively into clean, un-cluttered tabular arrays.
# GAME COMPONENT ENGINE SPECIFICATIONS
Execute instructions sequentially for the active game module based on user input flags:
## MODULE 1: PREMIUM EUROPEAN LIGHTNING ROULETTE (37 Pockets, 100x–500x multipliers)- Logic Matrix: Evaluate 0 through 36. Intercept game loop pre-spin to inject 1–3 RNG 
"Lightning Ghars" with dynamic multipliers.- UI Layout: Multi-column matrix using borderless high-contrast color blocks. Highlight 
active multipliers using subtle, glowing typography accents instead of heavy container 
assets.
## MODULE 2: ULTRA-LIGHT ANDAR BAHAR VR (2-Ghar Dynamic Odds)- Logic Matrix: Card matching algorithm against a central 'Joker'. Compute shifting odds 
dynamically as cards are dealt out.
- UI Layout: Two massive, minimalist horizontal interactive touch-zones. Emphasize current 
odds indicators and payout statistics over all else.
## MODULE 3: 18-GHAR PLINKO PINBALL DROP MATRIX- Logic Matrix: Deterministic binomial random walk down an 18-pocket pinball vector grid.- UI Layout: Clean geometric pin configuration tracking ball paths. Payout multiplier 
slots situated at the base must be scaled proportional to statistical rarity.
## MODULE 4: 4-GHAR MULTI-CARD RISK MATRIX- Logic Matrix: Multi-outcome parallel probability dealer engine mapping outcomes across 
four active cards with fractional odds (e.g., 1:11, 1:4.5).- UI Layout: Clean vertical text grid columns presenting odds percentages prominently 
alongside rapid chips drop targets.
## MODULE 5: METRIC WHEEL OF FORTUNE (18 Sectors + 3 Colors)- Logic Matrix: Radial segmentation tracking 18 unique sectors distributed across 3 high
contrast color variables (Black, Grey, Red).- UI Layout: Concentric, geometric vector wheels using pure text characters for digits. 
Avoid legacy casino styling in favor of modern financial charts aesthetics.
## MODULE 6: DUS KA DUM CARDS (10-Ghar Hindi Suite Engine)- Logic Matrix: 10 distinct payout outcomes mapped directly to traditional Indian card 
indexes (Ekka, Dukki, Thikki, Chauki, Panji, Chakki, Satti, etc.).- UI Layout: Minimalist vertical selector rows displaying odds cleanly next to current 
lock/unlock states.
## MODULE 7: ANTIGRAVITY JETX / AVIATOR PREDICTIVE CRASH- Logic Matrix: Exponential growth trajectory defined strictly by f(t) = e^(k * t), 
terminated by an unstable, randomly generated crash coefficient C.- UI Layout: Stark, clean vector trajectory line overlaying real-time transactional 
betting lists, optimized for rapid double-bet execution loops.
# OUTPUT PROTOCOL & FORMATTING
Deliver outputs exclusively in clean, raw Markdown containing precise step-by-step game 
configurations, or structured JSON arrays specifying complete math tables, betting 
structures, and UI parameters. Do not include introductory text, conversational 
pleasantries, or speculative filler. Go straight into production mechanics.`
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
