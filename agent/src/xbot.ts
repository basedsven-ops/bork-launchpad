import { TwitterApi, TweetV2, ApiV2Includes } from "twitter-api-v2";
import * as dotenv from "dotenv";
import { MessageParser, ActionResponse } from "./parser";
import { BlockchainManager } from "./wallet";
import { TransactionHandler } from "./tx";

dotenv.config();

const POLL_INTERVAL_MS = 15_000; // Poll mentions every 15 seconds

export class XBot {
  private client: TwitterApi;
  private readOnly: TwitterApi;
  private parser: MessageParser;
  private manager: BlockchainManager;
  private txHandler: TransactionHandler;
  private botUserId: string = "";
  private botUsername: string = "";
  private lastSeenTweetId: string | undefined;
  private processedTweetIds: Set<string> = new Set();

  constructor() {
    // OAuth 1.0a User Context (read + write)
    this.client = new TwitterApi({
      appKey: process.env.X_API_KEY || "",
      appSecret: process.env.X_API_SECRET || "",
      accessToken: process.env.X_ACCESS_TOKEN || "",
      accessSecret: process.env.X_ACCESS_SECRET || "",
    });

    this.readOnly = this.client.readOnly;
    this.parser = new MessageParser();
    this.manager = new BlockchainManager();
    this.txHandler = new TransactionHandler(this.manager);
  }

  public async start() {
    console.log("🐦 Starting X Bot for RH-Bankr...");

    // Verify credentials & get bot user ID
    try {
      const me = await this.client.v2.me();
      this.botUserId = me.data.id;
      this.botUsername = me.data.username;
      console.log(`✅ Authenticated as @${this.botUsername} (ID: ${this.botUserId})`);
    } catch (error: any) {
      console.error("❌ Failed to authenticate with X API:", error.message);
      console.error("   Make sure X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET are set in .env");
      process.exit(1);
    }

    console.log(`🔄 Polling for @${this.botUsername} mentions every ${POLL_INTERVAL_MS / 1000}s...\n`);

    // Initial poll
    await this.pollMentions();

    // Set up recurring poll
    setInterval(async () => {
      try {
        await this.pollMentions();
      } catch (error: any) {
        console.error("⚠️ Poll error:", error.message);
      }
    }, POLL_INTERVAL_MS);
  }

  private async pollMentions() {
    const params: any = {
      max_results: 10,
      "tweet.fields": ["author_id", "created_at", "conversation_id", "text"],
      expansions: ["author_id"],
      "user.fields": ["username"],
    };

    // Only fetch tweets newer than the last one we saw
    if (this.lastSeenTweetId) {
      params.since_id = this.lastSeenTweetId;
    }

    const mentions = await this.client.v2.userMentionTimeline(this.botUserId, params);

    if (!mentions.data?.data || mentions.data.data.length === 0) {
      return; // No new mentions
    }

    // Process oldest first
    const tweets = [...mentions.data.data].reverse();
    const users = mentions.data.includes?.users || [];

    for (const tweet of tweets) {
      // Skip if already processed
      if (this.processedTweetIds.has(tweet.id)) continue;
      this.processedTweetIds.add(tweet.id);

      // Update high-water mark
      if (!this.lastSeenTweetId || BigInt(tweet.id) > BigInt(this.lastSeenTweetId)) {
        this.lastSeenTweetId = tweet.id;
      }

      // Find author username
      const author = users.find((u: any) => u.id === tweet.author_id);
      const username = author?.username || "unknown";

      // Strip the bot mention from the text
      const cleanText = tweet.text
        .replace(new RegExp(`@${this.botUsername}`, "gi"), "")
        .trim();

      console.log(`\n📨 New mention from @${username}: "${cleanText}"`);

      await this.handleTweet(tweet.id, username, cleanText);
    }

    // Keep processedTweetIds from growing forever (keep last 1000)
    if (this.processedTweetIds.size > 1000) {
      const arr = Array.from(this.processedTweetIds);
      this.processedTweetIds = new Set(arr.slice(arr.length - 500));
    }
  }

  private async handleTweet(tweetId: string, username: string, text: string) {
    const parsed = await this.parser.parse(text);
    console.log("🎯 Parsed:", JSON.stringify(parsed));

    let replyText: string;

    try {
      switch (parsed.action) {
        case "help":
          replyText = [
            `@${username} 📖 RH-Bankr Commands:`,
            ``,
            `🚀 ETH Launch: "launch token MyToken MTK 0.1"`,
            `🏦 RWA Launch: "launch RedditMeme RMEM backed by 50 RDDT"`,
            `💸 Buy w/ETH: "buy 0.05 MTK"`,
            `💸 Buy w/RWA: "buy 10 RDDT of RMEM"`,
            `📉 Sell: "sell 1000 MTK"`,
            ``,
            `📊 Supported RWA: $RDDT $UMC $WETH`,
            `⛓️ Powered by Robinhood Chain L2`,
          ].join("\n");
          break;

        case "launch":
          if (!parsed.name || !parsed.symbol) {
            replyText = `@${username} ❌ Couldn't parse token name/symbol. Try: "launch token MyToken MTK 0.1"`;
            break;
          }
          const liquidity = parsed.ethLiquidity || "0.1";
          const launchResult = await this.txHandler.launchToken(parsed.name, parsed.symbol, liquidity);
          replyText = [
            `@${username} 🎉 Token Launched!`,
            ``,
            `📛 ${parsed.name} ($${parsed.symbol})`,
            `📍 ${launchResult.tokenAddress}`,
            `💧 ${liquidity} ETH liquidity added`,
            `🔗 TX: ${launchResult.txHash}`,
            ``,
            `⛓️ On Robinhood Chain L2`,
          ].join("\n");
          break;

        case "launch_rwa":
          if (!parsed.name || !parsed.symbol || !parsed.collateralSymbol) {
            replyText = `@${username} ❌ Provide RWA details. Try: "launch RedditMeme RMEM backed by 50 RDDT"`;
            break;
          }
          const rwaLaunchResult = await this.txHandler.launchTokenBackedByRWA(
            parsed.name,
            parsed.symbol,
            parsed.collateralSymbol,
            parsed.targetCollateral || "100"
          );
          replyText = [
            `@${username} 🏦 RWA-Backed Token Launched!`,
            ``,
            `📛 ${parsed.name} ($${parsed.symbol})`,
            `📍 ${rwaLaunchResult.tokenAddress}`,
            `🔒 Backed by $${parsed.collateralSymbol.toUpperCase()} (target: ${parsed.targetCollateral || "100"})`,
            `📈 Bonding curve is now ACTIVE!`,
            `🔗 TX: ${rwaLaunchResult.txHash}`,
            ``,
            `⛓️ On Robinhood Chain L2`,
          ].join("\n");
          break;

        case "swap":
        case "buy":
          if (!parsed.tokenSymbol || !parsed.amount || !parsed.direction) {
            replyText = `@${username} ❌ Missing details. Try: "buy 0.1 MTK" or "sell 100 MTK"`;
            break;
          }

          if (parsed.direction === "buy") {
            const buyResult = await this.txHandler.buyToken(parsed.tokenSymbol, parsed.amount);
            replyText = [
              `@${username} 📈 Buy Successful!`,
              ``,
              `💸 Spent: ${parsed.amount} ETH`,
              `📈 Balance: ${buyResult.balance} $${parsed.tokenSymbol.toUpperCase()}`,
              `🔗 TX: ${buyResult.txHash}`,
            ].join("\n");
          } else {
            const sellResult = await this.txHandler.sellToken(parsed.tokenSymbol, parsed.amount);
            replyText = [
              `@${username} 💰 Sell Successful!`,
              ``,
              `📉 Sold: ${parsed.amount} $${parsed.tokenSymbol.toUpperCase()}`,
              `💰 ETH Balance: ${sellResult.ethBalance}`,
              `🔗 TX: ${sellResult.txHash}`,
            ].join("\n");
          }
          break;

        case "buy_rwa":
          if (!parsed.tokenSymbol || !parsed.amount) {
            replyText = `@${username} ❌ Missing details. Try: "buy 10 RDDT of RMEM"`;
            break;
          }
          const buyRwaResult = await this.txHandler.buyTokenWithRWA(parsed.tokenSymbol, parsed.amount);
          replyText = [
            `@${username} 📈 RWA Buy Successful!`,
            ``,
            `💸 Spent: ${parsed.amount} $${(parsed.collateralSymbol || "RWA").toUpperCase()}`,
            `🎫 New balance: ${buyRwaResult.memeBalance} $${parsed.tokenSymbol.toUpperCase()}`,
            `🔗 TX: ${buyRwaResult.txHash}`,
          ].join("\n");
          break;

        case "unknown":
        default:
          replyText = `@${username} 🤔 I didn't understand that. Tag me with "help" for usage!`;
          break;
      }
    } catch (error: any) {
      console.error("❌ TX Error:", error.message);
      replyText = `@${username} ❌ Transaction failed: ${error.message?.slice(0, 180)}`;
    }

    // Post reply
    try {
      await this.client.v2.reply(replyText, tweetId);
      console.log(`✅ Replied to @${username}`);
    } catch (error: any) {
      console.error(`❌ Failed to reply: ${error.message}`);
    }
  }
}
