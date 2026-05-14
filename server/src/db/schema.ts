import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const repositories = sqliteTable('repositories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  owner: text('owner').notNull(),
  repo: text('repo').notNull(),
  description: text('description'),
  htmlUrl: text('html_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  useGlobalCron: integer('use_global_cron', { mode: 'boolean' }).default(true),
  cronExpression: text('cron_expression').default('0 */6 * * *'),
  localVersion: text('local_version'),
  latestVersion: text('latest_version'),
  latestVersionUrl: text('latest_version_url'),
  hasUpdate: integer('has_update', { mode: 'boolean' }).default(false),
  lastCheckedAt: text('last_checked_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  description: text('description'),
});

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type Setting = typeof settings.$inferSelect;
