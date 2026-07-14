export default {
  async fetch(request, env) {
    // CORS configuration
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return new Response("Invalid JSON body", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { description, trackName, artistName, albumName, videoUrl, lyricsId, thumbnail, diagnostics } = payload;

    if (!description || typeof description !== "string" || !description.trim()) {
      return new Response("Missing description", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const hasTrack = !!(trackName || artistName || videoUrl || lyricsId);
    const targetWebhookUrl = hasTrack && env.SLACK_LIST_WEBHOOK_URL
      ? env.SLACK_LIST_WEBHOOK_URL
      : env.SLACK_WEBHOOK_URL;

    if (!targetWebhookUrl) {
      return new Response("Target Slack Webhook URL is not configured", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Build Slack blocks conditionally: only include track info section when present
    const slackBlocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "New Bug Report - Lyrike",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${description.trim()}`,
        },
      },
    ];

    if (hasTrack) {
      slackBlocks.push({ type: "divider" });
      slackBlocks.push({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Track:*\n${trackName || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Artist:*\n${artistName || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Album:*\n${albumName || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Lyrics ID:*\n${lyricsId || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Video URL:*\n${videoUrl ? `<${videoUrl}|Watch Video>` : "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Ext Version:*\n${diagnostics?.extensionVersion || "—"}`,
          },
        ],
        ...(thumbnail
          ? {
              accessory: {
                type: "image",
                image_url: thumbnail,
                alt_text: "Video Thumbnail",
              },
            }
          : {}),
      });
    }

    slackBlocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `*Ext Version:* ${diagnostics?.extensionVersion || "—"} | *Browser:* ${diagnostics?.browserVersion || "Unknown"} | *Timestamp:* ${diagnostics?.timestamp || "—"}`,
        },
      ],
    });

    const slackPayload = { blocks: slackBlocks };

    const isWorkflow = targetWebhookUrl.includes("/workflows/") || targetWebhookUrl.includes("/triggers/");
    const requestBody = isWorkflow
      ? {
          description,
          trackName,
          artistName,
          albumName,
          videoUrl,
          lyricsId,
          extensionVersion: diagnostics?.extensionVersion || "—",
          browserVersion: diagnostics?.browserVersion || "Unknown",
          timestamp: diagnostics?.timestamp || "—",
        }
      : slackPayload;

    try {
      const response = await fetch(targetWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        return new Response(`Slack Webhook error: ${response.status} - ${errText}`, {
          status: 502,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (e) {
      return new Response(`Internal server error: ${e.message}`, {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};