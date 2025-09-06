import { type User, type InsertUser, type QuizResponse, type InsertQuizResponse } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createQuizResponse(response: InsertQuizResponse): Promise<QuizResponse>;
  getQuizResponse(id: string): Promise<QuizResponse | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quizResponses: Map<string, QuizResponse>;

  constructor() {
    this.users = new Map();
    this.quizResponses = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createQuizResponse(insertResponse: InsertQuizResponse): Promise<QuizResponse> {
    const id = randomUUID();
    const response: QuizResponse = { 
      ...insertResponse,
      whatsapp: insertResponse.whatsapp || null,
      emotionalScore: insertResponse.emotionalScore || null,
      id,
      createdAt: new Date()
    };
    this.quizResponses.set(id, response);
    return response;
  }

  async getQuizResponse(id: string): Promise<QuizResponse | undefined> {
    return this.quizResponses.get(id);
  }
}

import { db } from './db';
import { users, quizResponses } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class PostgresStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createQuizResponse(insertResponse: InsertQuizResponse): Promise<QuizResponse> {
    const [response] = await db.insert(quizResponses).values(insertResponse).returning();
    return response;
  }

  async getQuizResponse(id: string): Promise<QuizResponse | undefined> {
    const [response] = await db.select().from(quizResponses).where(eq(quizResponses.id, id)).limit(1);
    return response;
  }
}

export const storage = new PostgresStorage();
