import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { writeFileSync } from "fs";

const client = new ElevenLabsClient({
  apiKey: process.env.API_KEY,
});

const RAY_AGENT_ID = "agent_2301kb9zprv8fw59befd80cqctwq";

async function main() {
  let allText = "";
  let hasMore = true;
  let cursor = undefined;
  let firstItem = true;

  while (hasMore) {
    const page = await client.conversationalAi.conversations.list({
      agentId: RAY_AGENT_ID,
      pageSize: 100,
      cursor,
    });

    const conversations = page.conversations || [];
    console.log(`Fetched ${conversations.length} conversations...`);

    // Debug: log first item keys so we can see the correct field names
    if (firstItem && conversations.length > 0) {
      console.log("First item keys:", Object.keys(conversations[0]));
      console.log("First item sample:", JSON.stringify(conversations[0], null, 2));
      firstItem = false;
    }

    for (const convo of conversations) {
      // Try all possible ID field names
      const id = convo.conversation_id ?? convo.conversationId ?? convo.id;
      if (!id) {
        console.log("Skipping convo with no ID:", convo);
        continue;
      }

      const detail = await client.conversationalAi.conversations.get(id);

      const transcript = detail.transcript || [];
      const lines = transcript.map(
        (t) => `${t.role?.toUpperCase()}: ${t.message}`
      );

      const startTime = convo.metadata?.start_time_unix_secs
        ?? convo.start_time_unix_secs
        ?? null;

      const date = startTime
        ? new Date(startTime * 1000).toLocaleString("en-NZ")
        : id;

      allText += `\n\n===== ${date} | ${id} =====\n\n`;
      allText += lines.join("\n");
    }

    hasMore = page.has_more || false;
    cursor = page.next_cursor || undefined;
  }

  writeFileSync("ray-transcripts.txt", allText.trim(), "utf8");
  console.log("Done! Saved to ray-transcripts.txt");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
