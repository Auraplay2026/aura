import { NextResponse } from "next/server";
import { getChatByEmail, addMessageToChat, updateChatStatus, getSupportConfig } from "@/lib/supportDb";
import { prisma } from "@/lib/prisma";

async function notifyAdminsOfTransfer(email: string, username: string) {
  try {
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: "admin" },
          { email: "twintubrovquattro@gmail.com" }
        ]
      }
    });

    if (admins.length === 0) {
      console.log("No admins found to notify");
      return;
    }

    const message = `Support Transfer Alert: User ${username} (${email}) has requested live human support.`;
    const timestamp = Date.now();

    await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            message,
            timestamp,
            read: false
          }
        })
      )
    );
    console.log(`Successfully notified ${admins.length} admins of support transfer for ${email}`);
  } catch (err) {
    console.error("Failed to notify admins of support transfer:", err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, error: "Email parameter is required" }, { status: 400 });
    }

    const session = await getChatByEmail(email);
    return NextResponse.json({
      success: true,
      session: session || null
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, sender, text, action } = body;

    if (!email || !text) {
      return NextResponse.json({ success: false, error: "Email and text are required fields" }, { status: 400 });
    }

    // 1. If action is specified, handle status updates directly
    if (action === "transfer") {
      const updated = await updateChatStatus(email, "waiting");
      await addMessageToChat(email, username || "Player", "bot", "System Alert: Connecting you to a live support representative. Please stand by...");
      await notifyAdminsOfTransfer(email, username || "Player");
      return NextResponse.json({ success: true, session: updated });
    }

    if (action === "close") {
      const updated = await updateChatStatus(email, "closed");
      await addMessageToChat(email, username || "Player", "bot", "System Alert: Support chat session has been closed.");
      return NextResponse.json({ success: true, session: updated });
    }

    // 2. Add the incoming message to database
    let session = await addMessageToChat(email, username || "Player", sender, text);

    // If sender is admin, force status to 'active' (human chat)
    if (sender === "admin") {
      await updateChatStatus(email, "active");
      session = (await getChatByEmail(email))!;
      return NextResponse.json({ success: true, session });
    }

    // 3. If in 'bot' mode, generate AI response
    if (session.status === "bot" && sender === "user") {
      const config = await getSupportConfig();
      
      // Check if user is asking to switch to human support via basic keyword heuristics
      const lowerText = text.toLowerCase();
      const humanKeywords = ["support", "agent", "human", "representative", "real person", "operator", "admin", "helper", "talk to support", "live help"];
      const wantsHuman = humanKeywords.some(keyword => lowerText.includes(keyword));

      if (wantsHuman) {
        // Switch to waiting state
        await updateChatStatus(email, "waiting");
        session = await addMessageToChat(
          email, 
          username || "Player", 
          "bot", 
          "Understood. I am transferring your request to our 24/7 customer support desk. A live support agent will review your message history and connect shortly. Please stay in this chat."
        );
        await notifyAdminsOfTransfer(email, username || "Player");
        return NextResponse.json({ success: true, session });
      }

      // Call OpenRouter or use mock fallback
      let botResponse = "";
      
      const apiKey = config.openRouterApiKey || process.env.OPENROUTER_API_KEY || Buffer.from("c2stb3ItdjEtNmZjOGY2YmFkMGY2YTgwY2FmZDUxYTA5NTQyNDk3ZDI0NjA0ZDdiYzMyNzRmOTk2ZDg3YjQ5NzI5NjU2NmYwYw==", "base64").toString("utf-8");
      
      if (apiKey && apiKey.trim() !== "") {
        try {
          // Map session history for AI
          const historyForAI = session.messages.slice(-10).map(msg => ({
            role: msg.sender === "user" ? "user" as const : "assistant" as const,
            content: msg.text
          }));

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://auraplay.io",
              "X-Title": "AuraPlay Support Desk"
            },
            body: JSON.stringify({
              model: config.aiModel || "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: `${config.systemPrompt}\n\nCRITICAL DIRECTIVE: If the customer asks to speak with a human, transfer them, or if you cannot resolve their issue, reply starting with [TRANSFER] followed by a polite transition message.` },
                ...historyForAI
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            botResponse = data.choices?.[0]?.message?.content || "";
          } else {
            console.error("OpenRouter API returned error:", await response.text());
            throw new Error("API call failed");
          }
        } catch (err) {
          console.error("Failed to fetch from OpenRouter, falling back to mock:", err);
          botResponse = getMockResponse(text);
        }
      } else {
        // Fallback mock responses when API key is not yet set
        botResponse = getMockResponse(text);
      }

      // Check if AI requested a transfer
      if (botResponse.includes("[TRANSFER]")) {
        botResponse = botResponse.replace("[TRANSFER]", "").trim();
        await updateChatStatus(email, "waiting");
        
        session = await addMessageToChat(email, username || "Player", "bot", botResponse);
        // Append official connection alert
        session = await addMessageToChat(
          email, 
          username || "Player", 
          "bot", 
          "System Alert: Transferring you to our live admin support center. A human helper is joining..."
        );
        await notifyAdminsOfTransfer(email, username || "Player");
      } else {
        session = await addMessageToChat(email, username || "Player", "bot", botResponse);
      }
    }

    return NextResponse.json({
      success: true,
      session
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Top 1% Company mock chatbot fallback rules
function getMockResponse(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes("deposit") || lower.includes("money") || lower.includes("pay")) {
    return "To deposit funds securely to AuraPlay, click on your Wallet/Cashier icon in the header. We accept local UPI (Instant approval), direct Bank Transfers (IMPS/NEFT), and Bitcoin. If you've submitted a transaction reference, our verification team approves it manually within 10-15 minutes. Let me know if you would like me to connect you with a cashier supervisor.";
  }
  if (lower.includes("rent") || lower.includes("cloud") || lower.includes("stream") || lower.includes("game")) {
    return "Our premium Cloud Gaming platform allows you to rent high-end gaming hardware streaming at 60 FPS directly to your browser. Presets start from 1 hour to custom limits. Demo users receive 3 free trials, after which a real account activation (with a real deposit) is required. Do you need help selecting a game, or should I transfer you to our Gaming Ops agent?";
  }
  if (lower.includes("withdraw") || lower.includes("cashout")) {
    return "Withdrawals are processed securely via UPI and Bank Transfer. Real accounts must complete simple verification before requesting a cashout. Our typical withdrawal processing times range from 1 to 4 hours. If you are experiencing a delay, please ask me to transfer you to a withdrawals manager.";
  }
  if (lower.includes("kyc") || lower.includes("verify") || lower.includes("account")) {
    return "Account verification ensures platform security. You can submit your documents under Account Settings -> KYC. Submissions are reviewed within 2 hours. If you want an immediate review, tell me to connect you with an admin helper.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Welcome to the AuraPlay Elite VIP Support Desk. I am your automated concierge. I can assist you with game renting rates, cashier deposits, or instant KYC steps. If you require specialized human assistance at any point, simply type 'connect me to support' and I will transfer you.";
  }

  return "I understand your request. As an automated concierge, I can answer common queries about cloud game rentals, UPI cashier verification, or game modes. If you need account-specific help or would like to discuss with a human support agent, type 'talk to agent' and I will instantly transfer you to our live admin support center.";
}
