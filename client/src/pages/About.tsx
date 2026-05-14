import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useI18nStore } from '@/i18n';

export function About() {
  const { locale, t } = useI18nStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/about?lang=${locale}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content);
        setLoading(false);
      })
      .catch(() => {
        setContent(t('about.loadFailed'));
        setLoading(false);
      });
  }, [locale]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="prose prose-sm dark:prose-invert max-w-none
        prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-code:bg-zinc-100 prose-code:dark:bg-zinc-800 prose-code:text-zinc-800 prose-code:dark:text-zinc-200 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-zinc-100 prose-pre:dark:bg-zinc-800 prose-pre:text-zinc-800 prose-pre:dark:text-zinc-200 prose-pre:border prose-pre:rounded-lg
        prose-table:border prose-th:border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-td:border prose-td:px-3 prose-td:py-2
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
