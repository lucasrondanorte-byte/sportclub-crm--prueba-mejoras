export enum Branch {
  Paraguay = 'Paraguay',
  Barracas = 'Barracas',
  Diagonal = 'Diagonal',
  MujerCentro = 'Mujer Centro',
  Tribunales = 'Tribunales',
}

export enum Role {
  Admin = 'admin', // Global Admin
  Manager = 'gerente', // Branch Manager
  Seller = 'vendedor',
  Viewer = 'visor',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branch: Branch;
}

export enum ProspectSource {
  Instagram = 'Instagram',
  Web = 'Web',
  Referral = 'Referido',
  WalkIn = 'Walk-in',
  Whatsapp = 'Whatsapp',
  Bajas = 'Bajas',
  GoogleSheet = 'Google Sheet',
}

export enum ProspectInterest {
  NotReported = 'No informado',
  Flex = 'Flex',
  FlexAnual1Pago = 'Flex Anual 1 pago',
  FlexUsoPlus = 'Flex Uso Plus',
  FlexUsoTotal = 'Flex Uso Total',
  Plus = 'Plus',
  PlusAnual1Pago = 'Plus Anual 1 pago',
  PlusAnual3Cuotas = 'Plus Anual 3 cuotas',
  PlusAnual6Cuotas = 'Plus Anual 6 cuotas',
  Total = 'Total',
  TotalAnual1Pago = 'Total Anual 1 pago',
  TotalAnual3Cuotas = 'Total Anual 3 cuotas',
  TotalAnual6Cuotas = 'Total Annual 6 cuotas',
  TotalSemestral1Pago = 'Total Semestral 1 pago',
  TotalSemestral6Cuotas = 'Total Semestral 6 cuotas',
  Local = 'Local',
  LocalTrimestral1Pago = 'Local trimestral 1 pago',
  LocalSemestral1Pago = 'Local Semestral 1 pago',
  LocalSemestral6Cuotas = 'Local Semestral 6 cuotas',
  LocalAnnual1Pago = 'Local Annual 1 pago',
  LocalAnnual3Cuotas = 'Local Annual 3 cuotas',
  LocalAnnual6Cuotas = 'Local Annual 6 cuotas',
  ACAPlus = 'ACA Plus',
  ACATOTAL = 'ACA TOTAL',
}


export enum ProspectStage {
  New = 'Nuevo',
  Contacted = 'Contactado',
  Trial = 'En prueba',
  Won = 'Cerrado ganado',
  Lost = 'Cerrado perdido',
}

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: ProspectSource;
  interest: ProspectInterest;
  stage: ProspectStage;
  assignedTo: string; // User ID
  branch: Branch;
  dni: string; // Encrypted
  address: string; // Encrypted
  notes: string; // Encrypted
  createdAt: string;
  updatedAt: string;
  nextActionDate: string | null;
  createdBy: string; // User ID
  updatedBy: string; // User ID
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  plan: string;
  fee: number;
  startDate: string;
  lastActionDate: string | null;
  originalSeller: string; // User ID
  branch: Branch;
  dni: string; // Encrypted
  address: string; // Encrypted
  notes: string; // Encrypted
  createdAt: string;
  updatedAt: string;
}

export enum TaskType {
  Call = 'llamada',
  WhatsApp = 'WhatsApp',
  Email = 'email',
  Visit = 'visita',
  Note = 'nota',
}

export enum TaskStatus {
  Pending = 'pendiente',
  Done = 'hecha',
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  dateTime: string;
  status: TaskStatus;
  relatedTo: string; // Prospect or Member ID
  assignedTo: string; // User ID
  result: string | null;
}

export interface Interaction {
  id: string;
  date: string;
  type: TaskType;
  summary: string;
  result: string;
  doneBy: string; // User ID
  relatedTo: string; // Prospect or Member ID
}