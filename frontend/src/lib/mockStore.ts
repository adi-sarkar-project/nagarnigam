// Frontend-only mock data store (no backend).
// State persists in localStorage so the demo feels real across reloads.

export type Role = "admin" | "citizen";
export type Category = "Cleaning" | "Electricity" | "Water" | "Roads";
export type Status = "Pending" | "Resolved";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface Complaint {
  id: string;
  userId: string;
  userEmail: string;
  category: Category;
  description: string;
  beforeImage: string; // dataURL
  afterImage?: string; // dataURL
  status: Status;
  createdAt: string;
  resolvedAt?: string;
}

const ADMIN_EMAIL = "admin@urbanresolve.gov.in";
const ADMIN_PASSWORD = "admin123";

const USERS_KEY = "nn_users";
const COMPLAINTS_KEY = "nn_complaints";
const SESSION_KEY = "nn_session";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeed() {
  const users = read<User[]>(USERS_KEY, []);
  if (!users.find((u) => u.email === ADMIN_EMAIL)) {
    users.push({
      id: "admin-1",
      name: "Municipal Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
    });
    write(USERS_KEY, users);
  }
}
ensureSeed();

export const auth = {
  adminEmail: ADMIN_EMAIL,
  adminPassword: ADMIN_PASSWORD,

  current(): User | null {
    return read<User | null>(SESSION_KEY, null);
  },
  login(email: string, password: string): User | null {
    const users = read<User[]>(USERS_KEY, []);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (user) write(SESSION_KEY, user);
    return user ?? null;
  },
  register(name: string, email: string, password: string): User | null {
    const users = read<User[]>(USERS_KEY, []);
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) return null;
    const role: Role = email.toLowerCase() === ADMIN_EMAIL ? "admin" : "citizen";
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role,
    };
    users.push(user);
    write(USERS_KEY, users);
    // Note: do NOT auto-login. Citizen must sign in from the Login page.
    return user;
  },
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};

export const complaints = {
  all(): Complaint[] {
    return read<Complaint[]>(COMPLAINTS_KEY, []).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  },
  forUser(userId: string): Complaint[] {
    return this.all().filter((c) => c.userId === userId);
  },
  create(input: Omit<Complaint, "id" | "createdAt" | "status">): Complaint {
    const list = read<Complaint[]>(COMPLAINTS_KEY, []);
    const c: Complaint = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    list.push(c);
    write(COMPLAINTS_KEY, list);
    return c;
  },
  attachAfter(id: string, afterImage: string) {
    const list = read<Complaint[]>(COMPLAINTS_KEY, []);
    const c = list.find((x) => x.id === id);
    if (c) {
      c.afterImage = afterImage;
      write(COMPLAINTS_KEY, list);
    }
  },
  resolve(id: string) {
    const list = read<Complaint[]>(COMPLAINTS_KEY, []);
    const c = list.find((x) => x.id === id);
    if (c && c.afterImage) {
      c.status = "Resolved";
      c.resolvedAt = new Date().toISOString();
      write(COMPLAINTS_KEY, list);
    }
  },
};
