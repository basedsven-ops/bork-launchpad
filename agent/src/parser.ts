import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

export interface ActionResponse {
  action: "launch" | "launch_rwa" | "buy" | "buy_rwa" | "sell" | "help" | "unknown";
  // Standard ETH-backed launch
  name?: string;
  symbol?: string;
  ethLiquidity?: string;
  // RWA-backed launch
  collateralSymbol?: string;     // e.g. "RDDT", "UMC"
  targetCollateral?: string;     // RWA amount needed to graduate (e.g. "100")
  // Buy / Sell
  direction?: "buy" | "sell";
  tokenSymbol?: string;
  amount?: string;
}

export class MessageParser {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_gemini_api_key_here" && apiKey.trim() !== "") {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.log("⚠️ GEMINI_API_KEY not configured. Falling back to Regex Heuristics.");
    }
  }

  public async parse(message: string): Promise<ActionResponse> {
    if (this.genAI) {
      try {
        return await this.parseWithAI(message);
      } catch (error) {
        console.error("AI Parser error, falling back to Regex:", error);
        return this.parseWithRegex(message);
      }
    } else {
      return this.parseWithRegex(message);
    }
  }

  private async parseWithAI(message: string): Promise<ActionResponse> {
    if (!this.genAI) throw new Error("GenAI not initialized");

    const model = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are the AI Parser Agent for Bankr on Robinhood Chain L2. Convert natural language commands into a structured JSON action.

Known RWA tokens: RDDT (Reddit stock), UMC (United Microelectronics), WETH (Wrapped ETH)

Available Actions:
1. "launch" — Standard ETH-backed token launch.
   Fields: name, symbol, ethLiquidity (default "0.1")
   Example: "launch token Banana BNA 0.2"

2. "launch_rwa" — Launch a memecoin backed by an RWA stock token (NOT ETH).
   Fields: name, symbol, collateralSymbol (RWA ticker e.g. "RDDT"), targetCollateral (amount of RWA)
   Example: "launch Reddit Ape RAPE backed by 50 RDDT"
   Example: "buat token RedGold RGD dengan 100 RDDT sebagai backing"

3. "buy" — Buy a standard ETH-backed token.
   Fields: direction="buy", tokenSymbol, amount (ETH)
   Example: "buy 0.05 ETH of BNA"

4. "buy_rwa" — Buy a memecoin using RWA tokens.
   Fields: direction="buy", tokenSymbol (meme), amount (RWA amount)
   Example: "buy 10 RDDT worth of RAPE"
   Example: "beli 5 RDDT untuk RAPE"

5. "sell" — Sell a token for ETH.
   Fields: direction="sell", tokenSymbol, amount (token amount)
   Example: "sell 1000 BNA"

6. "help" — User asks for help.
7. "unknown" — Any unrecognized input.

Return ONLY a valid JSON object. Example for RWA launch:
{"action":"launch_rwa","name":"Reddit Ape","symbol":"RAPE","collateralSymbol":"RDDT","targetCollateral":"50"}

User input: "${message}"
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText.trim()) as ActionResponse;
  }

  private parseWithRegex(message: string): ActionResponse {
    const text = message.toLowerCase().trim();

    // 1. HELP
    if (text.includes("help") || text === "h" || text.includes("tutorial") || text.includes("fitur") || text.includes("cara")) {
      return { action: "help" };
    }

    // 2. LAUNCH RWA — detect "backed by", "dengan", "collateral", "rwa"
    const rwaKeywords = ["backed by", "back oleh", "dengan collateral", "pakai rddt", "pakai umc", "pakai weth",
                         "rwa", "saham", "sebagai backing", "collateral"];
    const hasRWA = rwaKeywords.some(kw => text.includes(kw));
    const knownRWA = ["rddt", "umc", "weth"];
    const foundRWA = knownRWA.find(rwa => text.includes(rwa));

    if ((text.includes("launch") || text.includes("create") || text.includes("buat")) && (hasRWA || foundRWA)) {
      const parts = message.split(/\s+/);
      const cleanParts = parts.filter(p => !["launch", "create", "buat", "token", "backed", "by", "dengan", "sebagai", "backing", "collateral", "pakai"].includes(p.toLowerCase()));

      // Extract RWA symbol and amount
      const rwaSymbol = (foundRWA || "RDDT").toUpperCase();
      let targetCollateral = "100";
      let name = "Meme Token";
      let symbol = "MEME";

      for (let i = 0; i < cleanParts.length; i++) {
        const val = parseFloat(cleanParts[i]);
        if (!isNaN(val) && val > 0) {
          targetCollateral = cleanParts[i];
        } else if (knownRWA.includes(cleanParts[i].toLowerCase())) {
          // skip the rwa ticker
        } else if (cleanParts[i].length <= 6 && cleanParts[i] === cleanParts[i].toUpperCase()) {
          symbol = cleanParts[i];
        } else {
          name = cleanParts[i];
        }
      }

      if (name === "Meme Token") name = symbol + " Token";

      return {
        action: "launch_rwa",
        name,
        symbol,
        collateralSymbol: rwaSymbol,
        targetCollateral,
      };
    }

    // 3. STANDARD LAUNCH (ETH-backed)
    if (text.includes("launch") || text.includes("create") || text.includes("buat")) {
      const parts = message.split(/\s+/);
      const cleanParts = parts.filter(p => !["launch", "create", "buat", "token"].includes(p.toLowerCase()));

      let name = "Meme Token";
      let symbol = "MEME";
      let ethLiquidity = "0.1";

      if (cleanParts.length >= 2) {
        symbol = cleanParts[cleanParts.length - 1].toUpperCase();
        if (!isNaN(parseFloat(cleanParts[cleanParts.length - 1]))) {
          ethLiquidity = cleanParts[cleanParts.length - 1];
          symbol = cleanParts[cleanParts.length - 2].toUpperCase();
          name = cleanParts.slice(0, cleanParts.length - 2).join(" ");
        } else {
          name = cleanParts.slice(0, cleanParts.length - 1).join(" ");
        }
      } else if (cleanParts.length === 1) {
        symbol = cleanParts[0].toUpperCase();
        name = cleanParts[0] + " Token";
      }

      if (name.trim() === "") name = symbol + " Token";

      return { action: "launch", name, symbol, ethLiquidity };
    }

    // 4. BUY with RWA
    const buyKeywords = ["buy", "beli", "long", "purchase"];
    const sellKeywords = ["sell", "jual", "short"];

    const isBuy = buyKeywords.some(kw => text.includes(kw));
    const isSell = sellKeywords.some(kw => text.includes(kw));

    if (isBuy) {
      const parts = message.split(/\s+/);
      let amount = "0.1";
      let tokenSymbol = "TOKEN";
      const rwaFound = knownRWA.find(rwa => text.includes(rwa));

      for (let i = 0; i < parts.length; i++) {
        const val = parseFloat(parts[i]);
        if (!isNaN(val) && val > 0) {
          amount = parts[i];
          if (i + 1 < parts.length && !["eth", "weth", "to", "for", "of", "worth", "rddt", "umc"].includes(parts[i+1].toLowerCase())) {
            tokenSymbol = parts[i + 1].toUpperCase();
          } else {
            tokenSymbol = parts[parts.length - 1].toUpperCase();
          }
          break;
        }
      }

      // If paying in RWA, use buy_rwa action
      if (rwaFound && !text.includes("eth of") && !text.includes("eth untuk")) {
        return {
          action: "buy_rwa",
          direction: "buy",
          tokenSymbol,
          amount,
          collateralSymbol: rwaFound.toUpperCase(),
        };
      }

      return { action: "buy", direction: "buy", tokenSymbol, amount };
    }

    if (isSell) {
      const parts = message.split(/\s+/);
      let amount = "100";
      let tokenSymbol = "TOKEN";

      for (let i = 0; i < parts.length; i++) {
        const val = parseFloat(parts[i]);
        if (!isNaN(val) && val > 0) {
          amount = parts[i];
          tokenSymbol = parts[i + 1]?.toUpperCase() || parts[parts.length - 1].toUpperCase();
          break;
        }
      }

      return { action: "sell", direction: "sell", tokenSymbol, amount };
    }

    return { action: "unknown" };
  }
}
