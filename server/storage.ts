import { InsertUser, User, Form, FormSubmission } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import fs from "fs";
import path from "path";

const MemoryStore = createMemoryStore(session);

// Asegurar que el directorio data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const storageFile = path.join(dataDir, 'storage.json');

interface StorageData {
  users: Record<number, User>;
  forms: Record<number, Form>;
  submissions: Record<number, FormSubmission>;
  counters: {
    userId: number;
    formId: number;
    submissionId: number;
  };
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getForms(): Promise<Form[]>;
  getForm(id: number): Promise<Form | undefined>;
  createForm(form: Omit<Form, "id">): Promise<Form>;
  updateForm(id: number, form: Partial<Form>): Promise<Form>;
  deleteForm(id: number): Promise<void>;

  createSubmission(submission: Omit<FormSubmission, "id" | "driveFileId">): Promise<FormSubmission>;
  updateSubmission(id: number, updates: Partial<FormSubmission>): Promise<FormSubmission>;

  sessionStore: session.SessionStore;
}

export class JsonStorage implements IStorage {
  private data: StorageData;
  sessionStore: session.SessionStore;

  constructor() {
    this.data = this.loadData();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  private loadData(): StorageData {
    if (fs.existsSync(storageFile)) {
      const fileContent = fs.readFileSync(storageFile, 'utf-8');
      return JSON.parse(fileContent);
    }
    return {
      users: {},
      forms: {},
      submissions: {},
      counters: {
        userId: 1,
        formId: 1,
        submissionId: 1,
      },
    };
  }

  private saveData() {
    fs.writeFileSync(storageFile, JSON.stringify(this.data, null, 2));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.data.users[id];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Object.values(this.data.users).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.data.counters.userId++;
    const newUser = { ...user, id };
    this.data.users[id] = newUser;
    this.saveData();
    return newUser;
  }

  async getForms(): Promise<Form[]> {
    return Object.values(this.data.forms);
  }

  async getForm(id: number): Promise<Form | undefined> {
    return this.data.forms[id];
  }

  async createForm(form: Omit<Form, "id">): Promise<Form> {
    const id = this.data.counters.formId++;
    const newForm = { ...form, id };
    this.data.forms[id] = newForm;
    this.saveData();
    return newForm;
  }

  async updateForm(id: number, updates: Partial<Form>): Promise<Form> {
    const form = this.data.forms[id];
    if (!form) throw new Error("Form not found");

    const updatedForm = { ...form, ...updates };
    this.data.forms[id] = updatedForm;
    this.saveData();
    return updatedForm;
  }

  async deleteForm(id: number): Promise<void> {
    if (!this.data.forms[id]) throw new Error("Form not found");
    delete this.data.forms[id];
    this.saveData();
  }

  async createSubmission(submission: Omit<FormSubmission, "id" | "driveFileId">): Promise<FormSubmission> {
    const id = this.data.counters.submissionId++;
    const newSubmission = { ...submission, id, driveFileId: null };
    this.data.submissions[id] = newSubmission;
    this.saveData();
    return newSubmission;
  }

  async updateSubmission(id: number, updates: Partial<FormSubmission>): Promise<FormSubmission> {
    const submission = this.data.submissions[id];
    if (!submission) throw new Error("Submission not found");

    const updatedSubmission = { ...submission, ...updates };
    this.data.submissions[id] = updatedSubmission;
    this.saveData();
    return updatedSubmission;
  }
}

export const storage = new JsonStorage();