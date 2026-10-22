export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === "/slack/interact") {
      return handleInteract(request, env, ctx);
    }

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

    if (!payload || typeof payload !== "object") {
      return new Response("Invalid JSON body", { status: 400, headers: corsHeaders });
    }

    if (env.RATE_LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!(await env.RATE_LIMITER.limit({ key: ip })).success) {
        return new Response("Too many requests", { status: 429, headers: corsHeaders });
      }
    }

    const { diagnostics: rawDiagnostics } = payload;
    const description = str(payload.description, 2000);
    const trackName = str(payload.trackName);
    const artistName = str(payload.artistName);
    const albumName = str(payload.albumName);
    const lyricsId = /^\d{1,12}$/.test(String(payload.lyricsId ?? "")) ? String(payload.lyricsId) : "";
    const reportVideoId = parseVideoId(payload.videoUrl);
    // Rebuilt from the id, so only a real YouTube watch URL ever reaches Slack.
    const videoUrl = reportVideoId ? `https://www.youtube.com/watch?v=${reportVideoId}` : "";
    const thumbnail = /^https:\/\/i\.ytimg\.com\/[\w\-./?=&%]{1,300}$/.test(payload.thumbnail || "")
      ? payload.thumbnail
      : "";
    const diagnostics = {
      extensionVersion: str(rawDiagnostics?.extensionVersion, 40),
      browserVersion: str(rawDiagnostics?.browserVersion, 300),
      timestamp: str(rawDiagnostics?.timestamp, 40),
    };

    if (!description) {
      return new Response("Missing description", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const hasTrack = !!(trackName || artistName || videoUrl || lyricsId);

    if (hasTrack && reportVideoId && env.SLACK_BOT_TOKEN && env.SLACK_CHANNEL_ID) {
      ctx.waitUntil(
        createReport(env, { trackName, artistName, videoUrl, videoId: reportVideoId, lyricsId, description }).catch(
          (e) => console.error("createReport failed", e),
        ),
      );
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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
          text: `*Description:*\n${esc(description)}`,
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
            text: `*Track:*\n${esc(trackName) || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Artist:*\n${esc(artistName) || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Album:*\n${esc(albumName) || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Lyrics ID:*\n${esc(lyricsId) || "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Video URL:*\n${videoUrl ? `<${videoUrl}|Watch Video>` : "—"}`,
          },
          {
            type: "mrkdwn",
            text: `*Ext Version:*\n${esc(diagnostics.extensionVersion) || "—"}`,
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
          text: `*Ext Version:* ${esc(diagnostics.extensionVersion) || "—"} | *Browser:* ${esc(diagnostics.browserVersion) || "Unknown"} | *Timestamp:* ${esc(diagnostics.timestamp) || "—"}`,
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
          extensionVersion: diagnostics.extensionVersion || "—",
          browserVersion: diagnostics.browserVersion || "Unknown",
          timestamp: diagnostics.timestamp || "—",
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

// ---------------------------------------------------------------------------
// Slack "Resolve" flow
// ---------------------------------------------------------------------------

const VIDEO_ID_RE = /^[\w-]{11}$/;

const YOUTUBE_HOSTS = new Set(["www.youtube.com", "youtube.com", "music.youtube.com"]);

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
// Slack mrkdwn: escaping these stops <!channel>, <@user> and fake <url|text> links.
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function parseVideoId(videoUrl) {
  try {
    const url = new URL(videoUrl);
    if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
    const id = url.searchParams.get("v");
    return id && VIDEO_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

async function slack(env, method, body) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack ${method}: ${data.error}`);
  return data;
}

const DEFAULT_LIST_ID = "F0BF6LLURAT";
const COL = {
  track: "name",
  artist: "Col0BFN2NKKPU",
  link: "Col0BFQ05ESTB",
  resolve: "Col0BFJPB34BX",
  lyricsId: "Col0BFJPE4NFP",
  description: "Col0BG5LV1HPC",
};

const richText = (text) => [
  {
    type: "rich_text",
    elements: [{ type: "rich_text_section", elements: [{ type: "text", text: String(text || "—") }] }],
  },
];

async function createListItem(env, { trackName, artistName, videoUrl, lyricsId, description }) {
  const data = await slack(env, "slackLists.items.create", {
    list_id: env.SLACK_LIST_ID || DEFAULT_LIST_ID,
    initial_fields: [
      { column_id: COL.track, rich_text: richText(trackName) },
      { column_id: COL.artist, rich_text: richText(artistName) },
      { column_id: COL.link, link: [{ original_url: videoUrl, display_as_url: true }] },
      { column_id: COL.lyricsId, rich_text: richText(lyricsId) },
      { column_id: COL.description, rich_text: richText(description) },
    ],
  });
  return data.item.id;
}

async function createReport(env, report) {
  let itemId = null;
  try {
    itemId = await createListItem(env, report);
  } catch (e) {
    console.error("createListItem failed", e);
  }
  await postResolveMessage(env, { ...report, itemId });
}

async function tickListItem(env, itemId) {
  await slack(env, "slackLists.items.update", {
    list_id: env.SLACK_LIST_ID || DEFAULT_LIST_ID,
    cells: [{ row_id: itemId, column_id: COL.resolve, checkbox: true }],
  });
}

function postResolveMessage(env, { trackName, artistName, videoUrl, videoId, lyricsId, description, itemId }) {
  return slack(env, "chat.postMessage", {
    channel: env.SLACK_CHANNEL_ID,
    text: `Missing lyric: ${esc(trackName) || videoId}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${esc(trackName) || "—"}* – ${esc(artistName) || "—"}\n${videoUrl}\nlyricsId: \`${esc(lyricsId) || "—"}\`\n${esc(description)}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Resolve" },
            style: "primary",
            action_id: "open_resolve",
            value: JSON.stringify({ videoId, lyricsId: lyricsId ? String(lyricsId) : "", itemId }),
          },
        ],
      },
    ],
  });
}

async function verifySlackSignature(request, rawBody, secret) {
  const ts = request.headers.get("X-Slack-Request-Timestamp");
  const sig = request.headers.get("X-Slack-Signature");
  if (!ts || !sig || !secret) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`v0:${ts}:${rawBody}`));
  const expected =
    "v0=" + [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

async function handleInteract(request, env, ctx) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await request.text();
  if (!(await verifySlackSignature(request, rawBody, env.SLACK_SIGNING_SECRET))) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(new URLSearchParams(rawBody).get("payload") || "{}");

  // Resolving commits to the public blacklist, so only listed Slack users may do it.
  const allowed = (env.RESOLVER_IDS || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!allowed.includes(payload.user?.id)) {
    console.warn("resolve denied for", payload.user?.id);
    return payload.type === "view_submission"
      ? json({ response_action: "errors", errors: { new_id: "You are not allowed to resolve reports" } })
      : new Response("");
  }

  if (payload.type === "block_actions") {
    const action = payload.actions?.[0];
    if (action?.action_id !== "open_resolve") return new Response("");
    const { videoId, lyricsId, itemId } = JSON.parse(action.value);

    ctx.waitUntil(
      slack(env, "views.open", {
        trigger_id: payload.trigger_id,
        view: buildResolveModal({
          videoId,
          lyricsId,
          itemId,
          channel: payload.channel?.id || payload.container?.channel_id,
          ts: payload.message?.ts || payload.container?.message_ts,
        }),
      }).catch((e) => console.error("views.open failed", e)),
    );
    return new Response("");
  }

  if (payload.type === "view_submission" && payload.view?.callback_id === "resolve_modal") {
    const meta = JSON.parse(payload.view.private_metadata);
    const values = payload.view.state.values;
    const newId = (values.new_id.value.value || "").trim();
    const blacklistOld = (values.blacklist_old.value.selected_options || []).length > 0;

    if (!VIDEO_ID_RE.test(meta.videoId)) {
      return json({ response_action: "errors", errors: { new_id: "Invalid videoId" } });
    }
    if (newId && !/^\d+$/.test(newId)) {
      return json({ response_action: "errors", errors: { new_id: "Must be a number" } });
    }
    if (blacklistOld && !/^\d+$/.test(meta.lyricsId)) {
      return json({ response_action: "errors", errors: { blacklist_old: "No valid old lyricsId" } });
    }
    if (!newId && !blacklistOld) {
      return json({ response_action: "errors", errors: { new_id: "Enter a new lyricsId or tick blacklist" } });
    }

    ctx.waitUntil(
      (async () => {
        const user = payload.user?.id;
        try {
          const commitUrl = await updateBlacklist(
            { videoId: meta.videoId, oldId: Number(meta.lyricsId), newId: newId ? Number(newId) : null, blacklistOld },
            env,
          );
          if (meta.itemId) await tickListItem(env, meta.itemId).catch((e) => console.error("tickListItem failed", e));
          await finishMessage(env, meta, `✅ Resolved by <@${user}> · <${commitUrl}|commit>`);
        } catch (e) {
          console.error("resolve failed", e);
          await finishMessage(env, meta, `❌ Resolve failed (<@${user}>): ${e.message}`, true).catch(() => {});
        }
      })(),
    );
    return new Response(""); // closes the modal
  }

  return new Response("");
}

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { "Content-Type": "application/json" } });
}

function buildResolveModal({ videoId, lyricsId, itemId, channel, ts }) {
  return {
    type: "modal",
    callback_id: "resolve_modal",
    private_metadata: JSON.stringify({ videoId, lyricsId, itemId, channel, ts }),
    title: { type: "plain_text", text: "Resolve report" },
    submit: { type: "plain_text", text: "Commit" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `Video: \`${videoId}\`\nOld lyricsId: \`${esc(lyricsId) || "—"}\`` },
      },
      {
        type: "input",
        block_id: "new_id",
        optional: true,
        label: { type: "plain_text", text: "Replacement lyricsId" },
        hint: { type: "plain_text", text: "Leave empty to only blacklist the old one" },
        element: { type: "plain_text_input", action_id: "value" },
      },
      {
        type: "input",
        block_id: "blacklist_old",
        optional: true,
        label: { type: "plain_text", text: "Options" },
        element: {
          type: "checkboxes",
          action_id: "value",
          options: [{ text: { type: "plain_text", text: "Blacklist old lyricsId" }, value: "yes" }],
        },
      },
    ],
  };
}

async function finishMessage(env, { channel, ts }, text, keepButton = false) {
  if (!channel || !ts) return;
  const blocks = [{ type: "section", text: { type: "mrkdwn", text } }];
  await slack(env, "chat.update", { channel, ts, text, blocks: keepButton ? undefined : blocks });
}

const utf8ToB64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const b64ToUtf8 = (b64) => {
  const bin = atob(b64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

async function updateBlacklist({ videoId, oldId, newId, blacklistOld }, env) {
  const repo = env.GITHUB_REPO || "duckviet/lyrike";
  const path = env.GITHUB_BLACKLIST_PATH || "blacklist.json";
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "lyrike-report-proxy",
    Accept: "application/vnd.github+json",
  };

  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${await res.text()}`);
    const file = await res.json();
    const data = JSON.parse(b64ToUtf8(file.content));

    if (blacklistOld && !data.blacklistedLyricsIds.includes(oldId)) data.blacklistedLyricsIds.push(oldId);
    if (newId) data.videoOverrides[videoId] = newId;

    const put = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `chore(blacklist): resolve ${videoId}`,
        content: utf8ToB64(JSON.stringify(data, null, 2) + "\n"),
        sha: file.sha,
        ...(env.GITHUB_BRANCH ? { branch: env.GITHUB_BRANCH } : {}),
      }),
    });
    if (put.ok) return (await put.json()).commit.html_url;
    if (put.status !== 409) throw new Error(`GitHub PUT ${put.status}: ${await put.text()}`);
  }
  throw new Error("GitHub sha conflict after 3 retries");
}
