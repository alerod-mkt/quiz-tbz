import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const quizResponses = pgTable("quiz_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp"),
  answers: jsonb("answers").notNull(),
  emotionalScore: text("emotional_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de métricas do funil
export const funilMetricas = pgTable("funil_metricas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  etapa: text("etapa").notNull(), // landing, quiz_inicio, quiz_pergunta_2, etc.
  visitantes: integer("visitantes").notNull().default(0),
  conversoes: integer("conversoes").notNull().default(0),
  taxa_conversao: decimal("taxa_conversao", { precision: 5, scale: 2 }).notNull().default("0"),
  tempo_medio_segundos: integer("tempo_medio_segundos").notNull().default(0),
  ultima_atualizacao: timestamp("ultima_atualizacao").defaultNow().notNull(),
});

// Tabela de controle de IPs (para deduplicação de 24h)
export const ipControlTable = pgTable("ip_control", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ip_address: text("ip_address").notNull(),
  etapa: text("etapa").notNull(),
  ultima_acao: timestamp("ultima_acao").defaultNow().notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

// Tabela de métricas diárias
export const metricasDiarias = pgTable("metricas_diarias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  data: text("data").notNull().unique(), // YYYY-MM-DD
  visitantes_unicos: integer("visitantes_unicos").notNull().default(0),
  quiz_iniciados: integer("quiz_iniciados").notNull().default(0),
  quiz_completados: integer("quiz_completados").notNull().default(0),
  vsl_visualizacoes: integer("vsl_visualizacoes").notNull().default(0),
  sales_visualizacoes: integer("sales_visualizacoes").notNull().default(0),
  adicionou_carrinho: integer("adicionou_carrinho").notNull().default(0),
  conversoes_compra: integer("conversoes_compra").notNull().default(0),
  taxa_conversao_geral: decimal("taxa_conversao_geral", { precision: 5, scale: 2 }).notNull().default("0"),
  tempo_medio_total: integer("tempo_medio_total").notNull().default(0),
  urgencia_critica: integer("urgencia_critica").notNull().default(0),
  urgencia_alta: integer("urgencia_alta").notNull().default(0),
  urgencia_moderada: integer("urgencia_moderada").notNull().default(0),
  horarios_atividade: jsonb("horarios_atividade").notNull().default('{}'),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
  atualizado_em: timestamp("atualizado_em").defaultNow().notNull(),
});

// Tabela de sessões anônimas
export const sessoesAnonimas = pgTable("sessoes_anonimas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  session_id: integer("session_id").notNull().unique(),
  timestamp_inicio: timestamp("timestamp_inicio").defaultNow().notNull(),
  etapa_inicial: text("etapa_inicial").notNull(),
  etapa_final: text("etapa_final").notNull(),
  tempo_total_segundos: integer("tempo_total_segundos").notNull().default(0),
  perguntas_respondidas: integer("perguntas_respondidas").notNull().default(0),
  resultado_urgencia: text("resultado_urgencia").notNull().default(''),
  abandonou_em: text("abandonou_em"),
  completou: boolean("completou").notNull().default(false),
  hora_acesso: integer("hora_acesso").notNull(),
  data_acesso: text("data_acesso").notNull(),
  ip_address: text("ip_address").notNull().default(''),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuizResponseSchema = createInsertSchema(quizResponses).pick({
  nome: true,
  email: true,
  whatsapp: true,
  answers: true,
  emotionalScore: true,
});

export const insertFunilMetricasSchema = createInsertSchema(funilMetricas).omit({
  id: true,
  ultima_atualizacao: true,
});

export const insertMetricasDiariasSchema = createInsertSchema(metricasDiarias).omit({
  id: true,
  criado_em: true,
  atualizado_em: true,
});

export const insertSessoesAnonimas = createInsertSchema(sessoesAnonimas).omit({
  id: true,
  criado_em: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuizResponse = z.infer<typeof insertQuizResponseSchema>;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type FunilMetricas = typeof funilMetricas.$inferSelect;
export type InsertFunilMetricas = z.infer<typeof insertFunilMetricasSchema>;
export type MetricasDiarias = typeof metricasDiarias.$inferSelect;
export type InsertMetricasDiarias = z.infer<typeof insertMetricasDiariasSchema>;
export type SessoesAnonimas = typeof sessoesAnonimas.$inferSelect;
export type InsertSessoesAnonimas = z.infer<typeof insertSessoesAnonimas>;
