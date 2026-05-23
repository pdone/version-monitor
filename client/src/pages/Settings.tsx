import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettingsStore } from '@/stores';
import { toast } from '@/components/ui/toast';
import { useI18nStore } from '@/i18n';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Settings() {
  const { settings, defaults, fetchSettings, fetchDefaults, updateSettings, testNotification } = useSettingsStore();
  const { t } = useI18nStore();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
    fetchDefaults();
  }, [fetchSettings, fetchDefaults]);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleKeys = useMemo(() => ['webhook_enabled', 'ntfy_enabled', 'vocechat_enabled'], []);

  const isDirty = useMemo(() => {
    return Object.keys(formData).some((key) => {
      if (toggleKeys.includes(key)) return false;
      return formData[key] !== (settings[key] ?? '');
    });
  }, [formData, settings, toggleKeys]);

  const handleTestNotification = async (channel: string) => {
    setTestLoading(channel);
    try {
      const templates: Record<string, string> = {};
      if (channel === 'webhook') {
        templates.webhook_body = formData.webhook_body || defaults.webhook_body || '';
      } else if (channel === 'ntfy') {
        templates.ntfy_body = formData.ntfy_body || defaults.ntfy_body || '';
      } else if (channel === 'vocechat') {
        templates.vocechat_body = formData.vocechat_body || defaults.vocechat_body || '';
      }
      const result = await testNotification(channel, templates);
      if (result.errors && result.errors.length > 0) {
        toast({ title: t('settings.testPartialFail'), description: result.errors.join('\n'), variant: 'destructive' });
      } else {
        toast({ title: t('settings.testSuccess') });
      }
    } catch (err: any) {
      toast({ title: t('settings.testFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setTestLoading(null);
    }
  };

  const handleCopy = async (key: string) => {
    const value = defaults[key] || '';
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const isTemplateField = (key: string) => key.endsWith('_body');

  const isEnabled = (channel: string) => {
    const key = `${channel}_enabled`;
    return formData[key] !== 'false';
  };

  const handleToggleEnabled = async (channel: string, checked: boolean) => {
    const key = `${channel}_enabled`;
    const value = checked ? 'true' : 'false';
    setFormData((prev) => ({ ...prev, [key]: value }));
    try {
      await updateSettings({ [key]: value });
      toast({ title: t('settings.saveSuccess') });
    } catch (err: any) {
      setFormData((prev) => ({ ...prev, [key]: value === 'true' ? 'false' : 'true' }));
      toast({ title: t('settings.saveFailed'), description: err.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings(formData);
      toast({ title: t('settings.saveSuccess') });
    } catch (err: any) {
      toast({ title: t('settings.saveFailed'), description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const getValue = (key: string) => {
    if (formData[key] !== undefined) {
      return formData[key];
    }
    return defaults[key] || '';
  };

  interface SettingItem {
    key: string;
    label: string;
    placeholder?: string;
    description?: string;
    type: 'text' | 'password' | 'select' | 'textarea';
    options?: string[];
    condition?: (formData: Record<string, string>) => boolean;
  }

  const settingGroups: {
    title: string;
    description: string;
    channel: string | null;
    settings: SettingItem[];
  }[] = [
    {
      title: t('settings.security'),
      description: t('settings.securityDesc'),
      channel: null,
      settings: [
        {
          key: 'access_password',
          label: t('settings.accessPassword'),
          placeholder: t('settings.accessPasswordPlaceholder'),
          description: t('settings.accessPasswordHelp'),
          type: 'password' as const,
        },
      ],
    },
    {
      title: t('settings.github'),
      description: t('settings.githubDesc'),
      channel: null,
      settings: [
        {
          key: 'github_token',
          label: t('settings.githubToken'),
          placeholder: t('settings.githubTokenPlaceholder'),
          description: t('settings.githubTokenHelp'),
          type: 'password' as const,
        },
      ],
    },
    {
      title: t('settings.globalCron'),
      description: t('settings.globalCronDesc'),
      channel: null,
      settings: [
        {
          key: 'global_cron',
          label: t('settings.globalCron'),
          placeholder: '0 2 * * *',
          description: t('settings.globalCronHelp'),
          type: 'text' as const,
        },
      ],
    },
    {
      title: t('settings.webhook'),
      description: t('settings.webhookDesc'),
      channel: 'webhook',
      settings: [
        {
          key: 'webhook_url',
          label: t('settings.webhookUrl'),
          placeholder: t('settings.webhookUrlPlaceholder'),
          description: t('settings.webhookUrlHelp'),
          type: 'text' as const,
        },
        {
          key: 'webhook_method',
          label: t('settings.webhookMethod'),
          type: 'select' as const,
          options: ['POST', 'GET'],
        },
        {
          key: 'webhook_headers',
          label: t('settings.webhookHeaders'),
          placeholder: t('settings.webhookHeadersPlaceholder'),
          description: t('settings.webhookHeadersHelp'),
          type: 'textarea' as const,
        },
        {
          key: 'webhook_body',
          label: t('settings.webhookBody'),
          placeholder: t('settings.webhookBodyPlaceholder'),
          description: t('settings.webhookBodyHelp'),
          type: 'textarea' as const,
        },
      ],
    },
    {
      title: t('settings.ntfy'),
      description: t('settings.ntfyDesc'),
      channel: 'ntfy',
      settings: [
        {
          key: 'ntfy_url',
          label: t('settings.ntfyUrl'),
          placeholder: t('settings.ntfyUrlPlaceholder'),
          description: t('settings.ntfyUrlHelp'),
          type: 'text' as const,
        },
        {
          key: 'ntfy_topic',
          label: t('settings.ntfyTopic'),
          placeholder: t('settings.ntfyTopicPlaceholder'),
          description: t('settings.ntfyTopicHelp'),
          type: 'text' as const,
        },
        {
          key: 'ntfy_method',
          label: t('settings.ntfyMethod'),
          type: 'select' as const,
          options: ['POST', 'GET'],
        },
        {
          key: 'ntfy_headers',
          label: t('settings.ntfyHeaders'),
          placeholder: t('settings.ntfyHeadersPlaceholder'),
          description: t('settings.ntfyHeadersHelp'),
          type: 'textarea' as const,
        },
        {
          key: 'ntfy_body',
          label: t('settings.ntfyBody'),
          placeholder: t('settings.ntfyBodyPlaceholder'),
          description: t('settings.ntfyBodyHelp'),
          type: 'textarea' as const,
        },
      ],
    },
    {
      title: t('settings.vocechat'),
      description: t('settings.vocechatDesc'),
      channel: 'vocechat',
      settings: [
        {
          key: 'vocechat_url',
          label: t('settings.vocechatUrl'),
          placeholder: t('settings.vocechatUrlPlaceholder'),
          description: t('settings.vocechatUrlHelp'),
          type: 'text' as const,
        },
        {
          key: 'vocechat_token',
          label: t('settings.vocechatToken'),
          placeholder: t('settings.vocechatTokenPlaceholder'),
          description: t('settings.vocechatTokenHelp'),
          type: 'password' as const,
        },
        {
          key: 'vocechat_target_type',
          label: t('settings.vocechatTargetType'),
          type: 'select' as const,
          options: ['channel', 'user'],
        },
        {
          key: 'vocechat_channel',
          label: t('settings.vocechatChannel'),
          placeholder: t('settings.vocechatChannelPlaceholder'),
          description: t('settings.vocechatChannelHelp'),
          type: 'text' as const,
          condition: (formData: Record<string, string>) => (formData.vocechat_target_type || 'channel') === 'channel',
        },
        {
          key: 'vocechat_user',
          label: t('settings.vocechatUser'),
          placeholder: t('settings.vocechatUserPlaceholder'),
          description: t('settings.vocechatUserHelp'),
          type: 'text' as const,
          condition: (formData: Record<string, string>) => formData.vocechat_target_type === 'user',
        },
        {
          key: 'vocechat_body',
          label: t('settings.vocechatBody'),
          placeholder: t('settings.vocechatBodyPlaceholder'),
          description: t('settings.vocechatBodyHelp'),
          type: 'textarea' as const,
        },
      ],
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t('settings.title')}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.appearance')}</CardTitle>
            <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.language')}</Label>
              <LanguageSwitcher />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.theme')}</Label>
              <ThemeSwitcher />
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {settingGroups.map((group) => (
              <Card key={group.title}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle>{group.title}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                    {group.channel && (
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`${group.channel}-enabled`} className="text-sm">
                            {isEnabled(group.channel) ? t('settings.enabled') : t('settings.disabled')}
                          </Label>
                          <Switch
                            id={`${group.channel}-enabled`}
                            checked={isEnabled(group.channel)}
                            onCheckedChange={(checked) => handleToggleEnabled(group.channel!, checked)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={testLoading === group.channel}
                          onClick={() => handleTestNotification(group.channel!)}
                        >
                          {testLoading === group.channel ? t('settings.testing') : t('settings.testNotification')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.settings
                    .filter((setting) => !setting.condition || setting.condition(formData))
                    .map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={setting.key}>{setting.label}</Label>
                        {isTemplateField(setting.key) && defaults[setting.key] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleCopy(setting.key)}
                              >
                                {copiedKey === setting.key ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-md">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs font-medium">{t('settings.viewDefaultTemplate')}</span>
                                </div>
                                <pre className="text-xs whitespace-pre-wrap break-all font-mono bg-muted p-2 rounded">
                                  {defaults[setting.key]}
                                </pre>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {setting.type === 'select' ? (
                        <Select
                          value={getValue(setting.key)}
                          onValueChange={(value) => handleChange(setting.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={setting.placeholder || t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            {setting.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : setting.type === 'textarea' ? (
                        <textarea
                          id={setting.key}
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                          placeholder={setting.placeholder}
                          value={getValue(setting.key)}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                        />
                      ) : (
                        <div className="relative">
                          <Input
                            id={setting.key}
                            type={setting.type === 'password' && showPassword[setting.key] ? 'text' : setting.type}
                            placeholder={setting.placeholder}
                            value={getValue(setting.key)}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            className={setting.type === 'password' ? 'pr-10' : ''}
                          />
                          {setting.type === 'password' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))}
                            >
                              {showPassword[setting.key] ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      {setting.description && (
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

          </div>
        </form>

        {isDirty && (
          <div className="fixed bottom-4 right-4 z-[101] flex items-center gap-3 rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-bottom-2 fade-in-0">
            <span className="text-sm font-medium">{t('settings.unsavedChanges')}</span>
            <Button size="sm" disabled={loading} onClick={handleSave}>
              {loading ? t('settings.saving') : t('common.save')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFormData(settings)}>
              {t('settings.discard')}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
