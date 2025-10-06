import {
  User,
  Prospect,
  Member,
  Task,
  Interaction,
  TaskStatus,
  Role,
  Branch,
  ProspectSource,
  ProspectInterest,
  ProspectStage,
} from '../types';
import {
  mockUsers,
  mockProspects,
  mockMembers,
  mockTasks,
  mockInteractions
} from '../data/mockData';
import { encrypt, decrypt, hashPassword, comparePassword } from './encryptionService';

// ---
//
// **MOCK API SERVICE with LocalStorage Persistence**
//
// This service simulates a backend API by using mock data.
// To make the demo more interactive, it uses localStorage to persist
// any changes (adds, updates) you make. Refreshing the page will
// not reset the data to its initial state.
//
// To reset the data, clear your browser's localStorage for this site.
//
// ---

const MOCK_DELAY = 500; // 500ms delay to simulate network latency

// Helper for handling mock API calls with simulated latency
const mockApiCall = <T>(logic: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                logic(resolve, reject);
            } catch(error) {
                reject(error);
            }
        }, MOCK_DELAY);
    });
};

const getFromStorage = <T>(key: string, fallback: T[]): T[] => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading or parsing localStorage key "${key}". Falling back to default data.`, error);
    return fallback;
  }
};

const saveToStorage = <T>(key:string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
}

// Helper to initialize data from localStorage or fall back to mock data
const initializeStorage = <T>(key: string, mockData: T[]): T[] => {
    const data = getFromStorage(key, mockData);
    if (!localStorage.getItem(key)) {
        saveToStorage(key, data);
    }
    return data;
}

// Initialize data
let users: any[] = initializeStorage('sportclub-crm-users', mockUsers);
let prospects: Prospect[] = initializeStorage('sportclub-crm-prospects', mockProspects);
let members: Member[] = initializeStorage('sportclub-crm-members', mockMembers);
let tasks: Task[] = initializeStorage('sportclub-crm-tasks', mockTasks);
let interactions: Interaction[] = initializeStorage('sportclub-crm-interactions', mockInteractions);

const decryptProspect = (p: Prospect): Prospect => ({
  ...p,
  dni: decrypt(p.dni),
  address: decrypt(p.address),
  notes: decrypt(p.notes),
});

const encryptProspect = (p: Prospect): Prospect => ({
  ...p,
  dni: encrypt(p.dni),
  address: encrypt(p.address),
  notes: encrypt(p.notes),
});

const decryptMember = (m: Member): Member => ({
  ...m,
  dni: decrypt(m.dni),
  address: decrypt(m.address),
  notes: decrypt(m.notes),
});

const encryptMember = (m: Member): Member => ({
  ...m,
  dni: encrypt(m.dni),
  address: encrypt(m.address),
  notes: encrypt(m.notes),
});

/* =========================
   GOOGLE SHEET HELPERS
   ========================= */
const GOOGLE_SHEET_ID = '1HSHlF6SroNGqwV3NDLmZJwNVtiwl_rVIesjPAzJE_Jg';
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=0`;
function stripBOM(s: string) { return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s; }
function unquote(s: string) {
  const t = (s ?? '').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}
function normalizeHeader(h: string) {
  return unquote(stripBOM(h || ''))
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}
function canonicalKey(h: string) {
  const k = normalizeHeader(h);
  if (['nombrecompleto'].includes(k)) return 'name';
  if (['telefono'].includes(k)) return 'phone';
  if (['email'].includes(k)) return 'email';
  if (['origen'].includes(k)) return 'origen';
  if (['dni'].includes(k)) return 'dni';
  if (['fecha'].includes(k)) return 'fecha';
  if (['sucursal'].includes(k)) return 'sucursal';
  if (['nombre','name','nombres','apellido y nombre','razon social'].includes(k)) return 'name';
  if (['whatsapp','telefono celular','tel','celular','phone','mobile'].includes(k)) return 'phone';
  if (['correo','correo electronico','e-mail','mail'].includes(k)) return 'email';
  if (['notas','observaciones','comentario','notes'].includes(k)) return 'notes';
  if (['source','origen'].includes(k)) return 'origen';
  return k;
}
function normalizePhone(raw: string) {
  if (!raw) return '';
  let s = raw.toString().trim();
  s = s.replace(/\s+/g,'').replace(/[()\-\.]/g,'').replace(/^00/,'+');
  return s;
}
function placeholderEmailFromPhone(phone: string) {
  const p = normalizePhone(phone).replace(/[^0-9+]/g,'').replace(/^\+/,'plus');
  return `whatsapp.${p}@placeholder.local`;
}
function parseCsvToRows(text: string): string[][] {
  const rows: string[][] = [];
  let cell = '', row: string[] = [];
  let inQuotes = false;
  const s = stripBOM(text);

  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i+1];
    if (inQuotes) {
      if (c === '"' && n === '"') { cell += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cell += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(unquote(cell)); cell = ''; }
      else if (c === '\n') { row.push(unquote(cell)); rows.push(row); row = []; cell = ''; }
      else if (c === '\r') { /* ignore */ }
      else { cell += c; }
    }
  }
  row.push(unquote(cell)); rows.push(row);
  if (rows.length && rows[rows.length-1].every(x => x === '')) rows.pop();
  return rows;
}
function rowsToObjectsCanonical(rows: string[][]): Record<string,string>[] {
  if (!rows.length) return [];
  const headers = rows[0].map(canonicalKey);
  return rows.slice(1).map(r => {
    const o: Record<string,string> = {};
    headers.forEach((h, i) => { if (h) o[h] = unquote(r[i] ?? '').trim(); });
    return o;
  });
}
/* ========================= */

export const api = {
  login: (email: string, password: string): Promise<User | null> => mockApiCall(resolve => {
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (foundUser && foundUser.password) {
        if (comparePassword(password, foundUser.password)) {
          const { password, ...userToReturn } = foundUser;
          resolve(userToReturn);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
  }),
  
  getUsers: (): Promise<User[]> => mockApiCall(resolve => {
    resolve(users.map(({ password, ...user }) => user));
  }),
  
  getProspects: (): Promise<Prospect[]> => mockApiCall(resolve => resolve(prospects.map(decryptProspect))),
  
  getMembers: (): Promise<Member[]> => mockApiCall(resolve => resolve(members.map(decryptMember))),

  getTasks: (): Promise<Task[]> => mockApiCall(resolve => resolve([...tasks])),

  getInteractions: (): Promise<Interaction[]> => mockApiCall(resolve => resolve([...interactions])),
  
  getInteractionsByRelatedId: (relatedId: string): Promise<Interaction[]> => mockApiCall(resolve => {
      const relatedInteractions = interactions.filter(i => i.relatedTo === relatedId);
      resolve(relatedInteractions);
  }),

  addProspect: (prospectData: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'branch'>): Promise<Prospect> => mockApiCall(resolve => {
    const seller = users.find(u => u.id === prospectData.assignedTo);
    const newProspect: Prospect = {
      ...prospectData,
      id: `prospect_${Date.now()}`,
      branch: seller?.branch || Branch.Paraguay,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    prospects.push(encryptProspect(newProspect));
    saveToStorage('sportclub-crm-prospects', prospects);
    resolve(newProspect);
  }),

  updateProspect: (prospectData: Prospect): Promise<Prospect> => mockApiCall((resolve, reject) => {
    const index = prospects.findIndex(p => p.id === prospectData.id);
    if (index !== -1) {
      const updatedProspect = {
          ...prospectData,
          updatedAt: new Date().toISOString()
      };
      prospects[index] = encryptProspect(updatedProspect);
      saveToStorage('sportclub-crm-prospects', prospects);
      resolve(updatedProspect);
    } else {
      reject(new Error("Prospect not found"));
    }
  }),

  addMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'branch' | 'lastActionDate'>): Promise<Member> => mockApiCall(resolve => {
    const seller = users.find(u => u.id === memberData.originalSeller);
    const newMember: Member = {
      ...memberData,
      id: `member_${Date.now()}`,
      branch: seller?.branch || Branch.Paraguay,
      lastActionDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    members.push(encryptMember(newMember));
    saveToStorage('sportclub-crm-members', members);
    resolve(newMember);
  }),

  addInteraction: (interactionData: Omit<Interaction, 'id' | 'date'>): Promise<Interaction> => mockApiCall(resolve => {
    const newInteraction: Interaction = {
      ...interactionData,
      id: `int_${Date.now()}`,
      date: new Date().toISOString(),
    };
    interactions.push(newInteraction);
    saveToStorage('sportclub-crm-interactions', interactions);

    const memberIndex = members.findIndex(m => m.id === newInteraction.relatedTo);
    if (memberIndex !== -1) {
        const member = members[memberIndex];
        members[memberIndex] = {
            ...member,
            lastActionDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        saveToStorage('sportclub-crm-members', members);
    }

    resolve(newInteraction);
  }),

  addTask: (taskData: Omit<Task, 'id'>): Promise<Task> => mockApiCall(resolve => {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
    };
    tasks.push(newTask);
    saveToStorage('sportclub-crm-tasks', tasks);
    resolve(newTask);
  }),

  updateTask: (taskData: Task): Promise<Task> => mockApiCall((resolve, reject) => {
    const index = tasks.findIndex(t => t.id === taskData.id);
    if (index !== -1) {
      tasks[index] = taskData;
      saveToStorage('sportclub-crm-tasks', tasks);
      
      if (taskData.status === TaskStatus.Done) {
        const memberIndex = members.findIndex(m => m.id === taskData.relatedTo);
        if (memberIndex !== -1) {
            const member = members[memberIndex];
            members[memberIndex] = {
                ...member,
                lastActionDate: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            saveToStorage('sportclub-crm-members', members);
        }
      }

      resolve(taskData);
    } else {
      reject(new Error("Task not found"));
    }
  }),

  addUser: (userData: Omit<User, 'id' | 'role'> & { password?: string }): Promise<User> => mockApiCall((resolve, reject) => {
    const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
      reject(new Error("Ya existe un usuario con este email."));
      return;
    }

    const newUser = {
      name: userData.name,
      email: userData.email,
      branch: userData.branch,
      id: `user_${Date.now()}`,
      role: Role.Viewer,
      password: userData.password ? hashPassword(userData.password) : undefined,
    };
    users.push(newUser);
    saveToStorage('sportclub-crm-users', users);
    
    const { password, ...userToReturn } = newUser;
    resolve(userToReturn);
  }),

  updateUser: (userData: User): Promise<User> => mockApiCall((resolve, reject) => {
    const index = users.findIndex(u => u.id === userData.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...userData };
      saveToStorage('sportclub-crm-users', users);
      const { password, ...userToReturn } = users[index];
      resolve(userToReturn);
    } else {
      reject(new Error("User not found"));
    }
  }),

  deleteUser: (userId: string): Promise<void> => mockApiCall((resolve, reject) => {
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length < initialLength) {
      saveToStorage('sportclub-crm-users', users);
      resolve();
    } else {
      reject(new Error("User not found"));
    }
  }),

  runGoogleSheetImport: async (currentUser: User, allSellers: User[]): Promise<{ success: boolean; message: string; importedCount: number; }> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!currentUser || allSellers.length === 0) {
                throw new Error("No hay vendedores disponibles para asignar los prospectos.");
            }

            const response = await fetch(GOOGLE_SHEET_URL);
            const rawText = await response.text();
            if (!response.ok) throw new Error(`Google Sheets respondió ${response.status}.`);
            if (/^\s*<!doctype html>|<html[\s>]/i.test(rawText)) {
                throw new Error('La hoja devolvió HTML (no CSV). Compartí como "Cualquier persona con el enlace: Lector" o "Publicar en la web".');
            }
            
            const rows = parseCsvToRows(rawText);
            const parsedData = rowsToObjectsCanonical(rows);

            if (parsedData.length === 0) {
                resolve({ success: true, importedCount: 0, message: "No se encontraron datos nuevos para importar." });
                return;
            }

            const allProspects = await api.getProspects();
            const existingPhones = new Set((allProspects || []).map(p => normalizePhone(p.phone || '')).filter(Boolean));
            const existingEmails = new Set((allProspects || []).map(p => (p.email || '').toLowerCase().trim()).filter(Boolean));

            let total = 0, missing = 0, dup = 0;
            const newRows: Array<{ name: string; phoneNorm: string; emailNorm: string; row: Record<string,string> }> = [];

            for (const row of parsedData) {
                total++;
                const name = (row['name'] || '').trim();
                const phoneNorm = normalizePhone(row['phone'] || row['whatsapp'] || '');
                const emailNorm = (row['email'] || '').toLowerCase().trim();

                if (!name || (!phoneNorm && !emailNorm)) { missing++; continue; }
                const isDup = (phoneNorm && existingPhones.has(phoneNorm)) || (emailNorm && existingEmails.has(emailNorm));
                if (isDup) { dup++; continue; }

                newRows.push({ name, phoneNorm, emailNorm, row });
            }

            if (newRows.length === 0) {
                const message = total > 0 && missing === total
                    ? 'No se creó ninguno: faltan Nombre y/o Teléfono/Email en todas las filas.'
                    : 'Todos los prospectos del archivo ya existen en el CRM.';
                resolve({ success: true, importedCount: 0, message });
                return;
            }

            const nextActionDate = new Date(); nextActionDate.setDate(nextActionDate.getDate() + 1);
            const prospectsToAdd = newRows.map((item, index) => {
                const assignedTo = allSellers[index % allSellers.length].id;
                const phone = item.phoneNorm;
                const email = item.emailNorm || placeholderEmailFromPhone(phone);
                const r = item.row;
                return {
                    name: item.name, phone, email,
                    source: ProspectSource.GoogleSheet, interest: ProspectInterest.NotReported, stage: ProspectStage.New,
                    assignedTo, dni: r['dni'] || '', address: r['sucursal'] || '',
                    notes: `Importado desde Google Sheet. Origen: ${r['origen'] || 'N/A'} | Sucursal: ${r['sucursal'] || 'N/A'} | Fecha: ${r['fecha'] || 'N/A'}`,
                    createdBy: currentUser.id, updatedBy: currentUser.id,
                    nextActionDate: nextActionDate.toISOString(),
                };
            });

            await Promise.all(prospectsToAdd.map(p => api.addProspect(p)));
            
            const resultMessage = `Filas: ${total} | Creados: ${prospectsToAdd.length} | Duplicados: ${dup} | Sin contacto: ${missing}`;
            resolve({ success: true, importedCount: prospectsToAdd.length, message: resultMessage });

        } catch (error: any) {
            console.error("Failed to import from Google Sheet", error);
            resolve({ success: false, message: error.message || "Ocurrió un error desconocido.", importedCount: 0 });
        }
    });
  },
};