import { NextResponse } from "next/server";
import { getChatSessions, getSupportConfig, saveSupportConfig } from "@/lib/supportDb";

export async function GET() {
  try {
    const sessions = getChatSessions();
    const config = getSupportConfig();
    
    // Hide API key partially for security
    const maskedConfig = {
      ...config,
      openRouterApiKey: config.openRouterApiKey 
        ? `${config.openRouterApiKey.substring(0, 7)}...${config.openRouterApiKey.substring(config.openRouterApiKey.length - 4)}`
        : ""
    };

    return NextResponse.json({
      success: true,
      sessions,
      config: maskedConfig
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { openRouterApiKey, aiModel, systemPrompt } = body;
    
    const config = getSupportConfig();
    
    // If API key is provided and contains asterisks (masked), keep the old one. Otherwise update.
    let updatedKey = config.openRouterApiKey;
    if (openRouterApiKey !== undefined) {
      if (openRouterApiKey.includes("...")) {
        // Keeps the existing key
      } else {
        updatedKey = openRouterApiKey;
      }
    }

    const newConfig = {
      openRouterApiKey: updatedKey,
      aiModel: aiModel || config.aiModel,
      systemPrompt: systemPrompt || config.systemPrompt
    };

    saveSupportConfig(newConfig);

    return NextResponse.json({
      success: true,
      message: "Support configuration updated successfully"
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
