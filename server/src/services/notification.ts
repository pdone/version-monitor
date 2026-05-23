import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Repository } from '../db/schema';

interface NotificationPayload {
  repo: Repository;
  newVersion: string;
  previousVersion: string | null;
}

function getSettingsMap(): Record<string, string> {
  const allSettings = db.select().from(settings).all();
  const map: Record<string, string> = {};
  for (const s of allSettings) {
    map[s.key] = s.value || '';
  }
  return map;
}

export function renderTemplate(template: string, payload: NotificationPayload): string {
  return template
    .replace(/\{owner\}/g, payload.repo.owner)
    .replace(/\{repo\}/g, payload.repo.repo)
    .replace(/\{repo_full\}/g, `${payload.repo.owner}/${payload.repo.repo}`)
    .replace(/\{latest_ver\}/g, payload.newVersion)
    .replace(/\{local_ver\}/g, payload.previousVersion || 'N/A')
    .replace(/\{release_url\}/g, payload.repo.latestVersionUrl || '')
    .replace(/\{timestamp\}/g, new Date().toISOString());
}

function parseHeaders(headersStr: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (headersStr) {
    headersStr.split('\n').forEach(line => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length > 0) {
        headers[key.trim()] = rest.join(':').trim();
      }
    });
  }
  return headers;
}

export const defaultWebhookBody = `{
  "event": "new_release",
  "owner": "{owner}",
  "repo": "{repo}",
  "repo_full": "{repo_full}",
  "latest_ver": "{latest_ver}",
  "local_ver": "{local_ver}",
  "release_url": "{release_url}",
  "timestamp": "{timestamp}"
}`;
const defaultMdBody = `- **{repo_full}:** *{local_ver}* **→ [{latest_ver}]({release_url})**`;
export const defaultNtfyBody = defaultMdBody;
export const defaultVocechatBody = defaultMdBody;

async function sendRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string
): Promise<void> {
  const fetchOptions: RequestInit = { method, headers };

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    fetchOptions.body = body;
  } else if (method === 'GET' && body) {
    const params = new URLSearchParams();
    try {
      const parsed = JSON.parse(body);
      Object.entries(parsed).forEach(([k, v]) => params.set(k, String(v)));
    } catch {
      params.set('message', body);
    }
    const separator = url.includes('?') ? '&' : '?';
    let response: Response;
    try {
      response = await fetch(`${url}${separator}${params.toString()}`, fetchOptions);
    } catch (err: any) {
      throw new Error(`Network error: ${err.message || 'fetch failed'}`);
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return;
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: any) {
    throw new Error(`Network error: ${err.message || 'fetch failed'}`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

async function sendWebhook(config: Record<string, string>, payload: NotificationPayload): Promise<void> {
  const url = config.webhook_url;
  const method = (config.webhook_method || 'POST').toUpperCase();
  const headers = parseHeaders(config.webhook_headers || '');
  const bodyTemplate = config.webhook_body || '';

  const body = renderTemplate(bodyTemplate || defaultWebhookBody, payload);

  if (!headers['Content-Type'] && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    headers['Content-Type'] = 'application/json';
  }

  await sendRequest(url, method, headers, body);
}

async function sendNtfy(config: Record<string, string>, payload: NotificationPayload): Promise<void> {
  const baseUrl = config.ntfy_url.replace(/\/+$/, '');
  const topic = config.ntfy_topic;
  const method = (config.ntfy_method || 'POST').toUpperCase();
  const headers = parseHeaders(config.ntfy_headers || '');
  const bodyTemplate = config.ntfy_body || '';

  const url = `${baseUrl}/${topic}`;
  const body = renderTemplate(bodyTemplate || defaultNtfyBody, payload);

  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'text/plain; charset=utf-8';
  }
  if (!headers['Title']) {
    headers['Title'] = `New Release`;
  }
  if (!headers['Click'] && payload.repo.latestVersionUrl) {
    headers['Click'] = payload.repo.latestVersionUrl;
  }
  if (!headers['Markdown']) {
    headers['Markdown'] = `yes`;
  }
  if (!headers['Tags']) {
    headers['Tags'] = `rocket`;
  }
  await sendRequest(url, method, headers, body);
}

async function sendVocechat(config: Record<string, string>, payload: NotificationPayload): Promise<void> {
  const baseUrl = config.vocechat_url.replace(/\/+$/, '');
  const token = config.vocechat_token;
  const targetType = config.vocechat_target_type || 'channel';
  const channelId = config.vocechat_channel;
  const userId = config.vocechat_user;
  const headers = parseHeaders(config.vocechat_headers || '');
  const bodyTemplate = config.vocechat_body || '';

  let url: string;
  if (targetType === 'user' && userId) {
    url = `${baseUrl}/api/bot/send_to_user/${userId}`;
  } else if (channelId) {
    url = `${baseUrl}/api/bot/send_to_group/${channelId}`;
  } else {
    throw new Error('VoceChat target not configured: set either vocechat_channel or vocechat_user');
  }

  const message = renderTemplate(bodyTemplate || defaultVocechatBody, payload);

  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'text/markdown';
  }
  if (!headers['x-api-key']) {
    headers['x-api-key'] = token;
  }

  console.log('VoceChat request:', { url, method: 'POST', headers: { ...headers, 'x-api-key': '***' } });
  await sendRequest(url, 'POST', headers, message);
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const config = getSettingsMap();

  const promises: Promise<void>[] = [];

  if (config.webhook_enabled !== 'false' && config.webhook_url) {
    promises.push(sendWebhook(config, payload).catch(console.error));
  }

  if (config.ntfy_enabled !== 'false' && config.ntfy_url && config.ntfy_topic) {
    promises.push(sendNtfy(config, payload).catch(console.error));
  }

  const vocechatEnabled = config.vocechat_url && config.vocechat_token &&
    ((config.vocechat_target_type === 'user' && config.vocechat_user) ||
     (config.vocechat_target_type !== 'user' && config.vocechat_channel));
  if (config.vocechat_enabled !== 'false' && vocechatEnabled) {
    promises.push(sendVocechat(config, payload).catch(console.error));
  }

  await Promise.all(promises);
}

export async function sendBatchNotification(payloads: NotificationPayload[]): Promise<void> {
  if (payloads.length === 0) {
    return;
  }

  if (payloads.length === 1) {
    return sendNotification(payloads[0]);
  }

  const config = getSettingsMap();

  const promises: Promise<void>[] = [];

  if (config.webhook_enabled !== 'false' && config.webhook_url) {
    promises.push(sendBatchWebhook(config, payloads).catch(console.error));
  }

  if (config.ntfy_enabled !== 'false' && config.ntfy_url && config.ntfy_topic) {
    promises.push(sendBatchNtfy(config, payloads).catch(console.error));
  }

  const vocechatEnabled = config.vocechat_url && config.vocechat_token &&
    ((config.vocechat_target_type === 'user' && config.vocechat_user) ||
     (config.vocechat_target_type !== 'user' && config.vocechat_channel));
  if (config.vocechat_enabled !== 'false' && vocechatEnabled) {
    promises.push(sendBatchVocechat(config, payloads).catch(console.error));
  }

  await Promise.all(promises);
}

async function sendBatchWebhook(config: Record<string, string>, payloads: NotificationPayload[]): Promise<void> {
  const url = config.webhook_url;
  const method = (config.webhook_method || 'POST').toUpperCase();
  const headers = parseHeaders(config.webhook_headers || '');
  const bodyTemplate = config.webhook_body || '';

  const batchBody = payloads.map(payload => {
    const body = renderTemplate(bodyTemplate || defaultWebhookBody, payload);
    return JSON.parse(body);
  });

  if (!headers['Content-Type'] && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    headers['Content-Type'] = 'application/json';
  }

  await sendRequest(url, method, headers, JSON.stringify(batchBody));
}

async function sendBatchNtfy(config: Record<string, string>, payloads: NotificationPayload[]): Promise<void> {
  const baseUrl = config.ntfy_url.replace(/\/+$/, '');
  const topic = config.ntfy_topic;
  const method = (config.ntfy_method || 'POST').toUpperCase();
  const headers = parseHeaders(config.ntfy_headers || '');
  const bodyTemplate = config.ntfy_body || '';

  const url = `${baseUrl}/${topic}`;
  
  const batchBody = payloads.map(payload => {
    return renderTemplate(bodyTemplate || defaultNtfyBody, payload);
  }).join('\n\n');

  if (!headers['Title']) {
    headers['Title'] = `New Releases (${payloads.length} repos)`;
  }
  if (!headers['Click'] && payloads[0].repo.latestVersionUrl) {
    headers['Click'] = payloads[0].repo.latestVersionUrl;
  }
  if (!headers['Markdown']) {
    headers['Markdown'] = `yes`;
  }
  if (!headers['Tags']) {
    headers['Tags'] = `rocket`;
  }
  await sendRequest(url, method, headers, batchBody);
}

async function sendBatchVocechat(config: Record<string, string>, payloads: NotificationPayload[]): Promise<void> {
  const baseUrl = config.vocechat_url.replace(/\/+$/, '');
  const token = config.vocechat_token;
  const targetType = config.vocechat_target_type || 'channel';
  const channelId = config.vocechat_channel;
  const userId = config.vocechat_user;
  const headers = parseHeaders(config.vocechat_headers || '');
  const bodyTemplate = config.vocechat_body || '';

  let url: string;
  if (targetType === 'user' && userId) {
    url = `${baseUrl}/api/bot/send_to_user/${userId}`;
  } else if (channelId) {
    url = `${baseUrl}/api/bot/send_to_group/${channelId}`;
  } else {
    throw new Error('VoceChat target not configured: set either vocechat_channel or vocechat_user');
  }

  let batchMessage = payloads.map(payload => {
    return renderTemplate(bodyTemplate || defaultVocechatBody, payload);
  }).join('\n\n');

  batchMessage = `🚀 **New Release**\n` + batchMessage;

  if (!headers['Content-Type']) {
    headers['Content-Type'] = 'text/markdown';
  }
  if (!headers['x-api-key']) {
    headers['x-api-key'] = token;
  }

  console.log('VoceChat batch request:', { url, method: 'POST', headers: { ...headers, 'x-api-key': '***' } });
  await sendRequest(url, 'POST', headers, batchMessage);
}

export async function sendTestNotification(channel?: string, templates?: Record<string, string>): Promise<{ success: boolean; errors: string[] }> {
  const testPayload: NotificationPayload = {
    repo: {
      id: 0,
      owner: 'test-owner',
      repo: 'test-repo',
      description: 'Test repository',
      htmlUrl: 'https://github.com/test-owner/test-repo',
      isActive: true,
      useGlobalCron: true,
      cronExpression: '0 */6 * * *',
      localVersion: 'v1.0.0',
      latestVersion: 'v2.0.0',
      latestVersionUrl: 'https://github.com/test-owner/test-repo/releases/tag/v2.0.0',
      hasUpdate: true,
      lastCheckedAt: new Date().toISOString(),
      latestReleasePublishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    newVersion: 'v2.0.0',
    previousVersion: 'v1.0.0',
  };

  const config = getSettingsMap();
  
  if (templates) {
    if (templates.webhook_body) config.webhook_body = templates.webhook_body;
    if (templates.ntfy_body) config.ntfy_body = templates.ntfy_body;
    if (templates.vocechat_body) config.vocechat_body = templates.vocechat_body;
  }
  
  console.log('sendTestNotification - channel:', channel, 'templates:', templates);
  console.log('sendTestNotification - config.webhook_body:', config.webhook_body?.substring(0, 100));
  console.log('sendTestNotification - config.ntfy_body:', config.ntfy_body?.substring(0, 100));
  console.log('sendTestNotification - config.vocechat_body:', config.vocechat_body?.substring(0, 100));
  const errors: string[] = [];
  const promises: Promise<void>[] = [];

  const shouldTest = (ch: string) => !channel || channel === ch;

  console.log('Testing notification, channel:', channel);

  if (shouldTest('webhook') && config.webhook_enabled !== 'false' && config.webhook_url) {
    console.log('Sending webhook test to:', config.webhook_url);
    promises.push(sendWebhook(config, testPayload).catch(e => { errors.push(`Webhook: ${e.message}`); }));
  }

  if (shouldTest('ntfy') && config.ntfy_enabled !== 'false' && config.ntfy_url && config.ntfy_topic) {
    console.log('Sending ntfy test to:', `${config.ntfy_url}/${config.ntfy_topic}`);
    promises.push(sendNtfy(config, testPayload).catch(e => { errors.push(`ntfy: ${e.message}`); }));
  }

  if (shouldTest('vocechat')) {
    const vocechatEnabled = config.vocechat_url && config.vocechat_token &&
      ((config.vocechat_target_type === 'user' && config.vocechat_user) ||
       (config.vocechat_target_type !== 'user' && config.vocechat_channel));
    if (config.vocechat_enabled !== 'false' && vocechatEnabled) {
      console.log('Sending VoceChat test to:', config.vocechat_url);
      promises.push(sendVocechat(config, testPayload).catch(e => { errors.push(`VoceChat: ${e.message}`); }));
    }
  }

  if (promises.length === 0) {
    return { success: false, errors: ['No notification channels configured'] };
  }

  await Promise.all(promises);
  console.log('Test notification completed, errors:', errors);
  return { success: errors.length === 0, errors };
}
