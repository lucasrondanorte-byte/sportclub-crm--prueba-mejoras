import { Role, Prospect, ProspectSource, ProspectInterest, ProspectStage, Member, MemberStatus, Task, TaskType, TaskStatus, Interaction, Branch } from '../types';
import { encrypt, hashPassword } from '../services/encryptionService';

const defaultPasswordHash = hashPassword('password');

// NOTE: The mockUsers array includes the 'password' hash for the mock API to function.
// The API layer is responsible for stripping this property before sending any user
// object to the client, conforming to the `User` type defined in `types.ts`.
export const mockUsers: any[] = [
  { id: 'user_admin', name: 'Global Admin', email: 'admin@gym.com', role: Role.Admin, branch: Branch.Paraguay, password: defaultPasswordHash },
  { id: 'user_manager_p', name: 'Gerente Paraguay', email: 'gerente.paraguay@gym.com', role: Role.Manager, branch: Branch.Paraguay, password: defaultPasswordHash },
  { id: 'user_2', name: 'Laura Martinez', email: 'laura@gym.com', role: Role.Seller, branch: Branch.Paraguay, password: defaultPasswordHash },
  { id: 'user_3', name: 'Carlos Gomez', email: 'carlos@gym.com', role: Role.Seller, branch: Branch.Barracas, password: defaultPasswordHash },
  { id: 'user_4', name: 'Viewer Diagonal', email: 'viewer.diagonal@gym.com', role: Role.Viewer, branch: Branch.Diagonal, password: defaultPasswordHash },
  { id: 'user_seller_t', name: 'Vendedor Tribunales', email: 'seller.tribunales@gym.com', role: Role.Seller, branch: Branch.Tribunales, password: defaultPasswordHash },
  { id: 'user_viewer_m', name: 'Viewer Mujer Centro', email: 'viewer.mujercentro@gym.com', role: Role.Viewer, branch: Branch.MujerCentro, password: defaultPasswordHash },
];

const today = new Date();
const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
const lastMonth = new Date(); lastMonth.setMonth(today.getMonth() - 1);
const threeDaysAgo = new Date(); threeDaysAgo.setDate(today.getDate() - 3);
const fiveDaysAgo = new Date(); fiveDaysAgo.setDate(today.getDate() - 5);
const tenDaysAgo = new Date(); tenDaysAgo.setDate(today.getDate() - 10);
const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(today.getDate() - 14);

export const mockProspects: Prospect[] = [
  // Branch: Paraguay
  {
    id: 'prospect_1', name: 'Ana Garcia', phone: '1122334455', email: 'ana.garcia@email.com',
    source: ProspectSource.Instagram, interest: ProspectInterest.FlexUsoTotal, stage: ProspectStage.New,
    assignedTo: 'user_2', branch: Branch.Paraguay, dni: encrypt('12345678'), address: encrypt('Calle Falsa 123, CABA'),
    notes: encrypt('Preguntó por horarios de la mañana.'), createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(),
    nextActionDate: today.toISOString(), createdBy: 'user_2', updatedBy: 'user_2'
  },
  {
    id: 'prospect_3', name: 'Mariana Lopez', phone: '1133445566', email: 'mariana.lopez@email.com',
    source: ProspectSource.Referral, interest: ProspectInterest.PlusAnual3Cuotas, stage: ProspectStage.Trial,
    assignedTo: 'user_2', branch: Branch.Paraguay, dni: encrypt('34567890'), address: encrypt('Boulevard de los Sueños Rotos'),
    notes: encrypt('Viene a la clase de prueba el viernes.'), createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString(), createdBy: 'user_2', updatedBy: 'user_2'
  },
   {
    id: 'prospect_5', name: 'Lucia Fernandez', phone: '1155667788', email: 'lucia.f@email.com',
    source: ProspectSource.Instagram, interest: ProspectInterest.ACAPlus, stage: ProspectStage.Lost,
    assignedTo: 'user_2', branch: Branch.Paraguay, dni: encrypt('56789012'), address: encrypt('Calle de la Amargura 99'),
    notes: encrypt('Eligió otro gimnasio por el precio.'), createdAt: lastMonth.toISOString(), updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    nextActionDate: null, createdBy: 'user_2', updatedBy: 'user_2'
  },
  // Branch: Barracas
  {
    id: 'prospect_2', name: 'Roberto Sanchez', phone: '1166778899', email: 'roberto.s@email.com',
    source: ProspectSource.Web, interest: ProspectInterest.TotalAnual1Pago, stage: ProspectStage.Contacted,
    assignedTo: 'user_3', branch: Branch.Barracas, dni: encrypt('23456789'), address: encrypt('Avenida Siempreviva 742'),
    notes: encrypt('Quiere un plan personalizado.'), createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: yesterday.toISOString(),
    nextActionDate: tomorrow.toISOString(), createdBy: 'user_3', updatedBy: 'user_3'
  },
  {
    id: 'prospect_4', name: 'Juan Perez', phone: '1144556677', email: 'juan.perez@email.com',
    source: ProspectSource.WalkIn, interest: ProspectInterest.LocalAnnual1Pago, stage: ProspectStage.Won,
    assignedTo: 'user_3', branch: Branch.Barracas, dni: encrypt('45678901'), address: encrypt('Plaza Central 10'),
    notes: encrypt('Se inscribió al plan anual.'), createdAt: lastMonth.toISOString(), updatedAt: lastMonth.toISOString(),
    nextActionDate: null, createdBy: 'user_3', updatedBy: 'user_3'
  },
  // Branch: Tribunales
  {
    id: 'prospect_6', name: 'Sofia Castillo', phone: '1123456789', email: 'sofia.c@email.com',
    source: ProspectSource.Instagram, interest: ProspectInterest.Flex, stage: ProspectStage.New,
    assignedTo: 'user_seller_t', branch: Branch.Tribunales, dni: encrypt('98765432'), address: encrypt('Calle de la Luna 456'),
    notes: encrypt('Preguntó por clases de yoga.'), createdAt: threeDaysAgo.toISOString(), updatedAt: threeDaysAgo.toISOString(),
    nextActionDate: tomorrow.toISOString(), createdBy: 'user_seller_t', updatedBy: 'user_seller_t'
  },
  // Branch: Paraguay
  {
    id: 'prospect_8', name: 'Valentina Rojas', phone: '1145678901', email: 'valentina.r@email.com',
    source: ProspectSource.Referral, interest: ProspectInterest.Total, stage: ProspectStage.Trial,
    assignedTo: 'user_2', branch: Branch.Paraguay, dni: encrypt('76543210'), address: encrypt('Girasoles 111'),
    notes: encrypt('Prueba de crossfit agendada.'), createdAt: tenDaysAgo.toISOString(), updatedAt: threeDaysAgo.toISOString(),
    nextActionDate: today.toISOString(), createdBy: 'user_2', updatedBy: 'user_2'
  },
  // Branch: Barracas
  {
    id: 'prospect_9', name: 'Mateo Diaz', phone: '1156789012', email: 'mateo.d@email.com',
    source: ProspectSource.WalkIn, interest: ProspectInterest.Local, stage: ProspectStage.Won,
    assignedTo: 'user_3', branch: Branch.Barracas, dni: encrypt('65432109'), address: encrypt('Avenida del Sol 321'),
    notes: encrypt('Se inscribió al plan local.'), createdAt: twoWeeksAgo.toISOString(), updatedAt: tenDaysAgo.toISOString(),
    nextActionDate: null, createdBy: 'user_3', updatedBy: 'user_3'
  },
  // Branch: Diagonal
  {
    id: 'prospect_11', name: 'Lucas Navarro', phone: '1178901234', email: 'lucas.n@email.com',
    source: ProspectSource.Bajas, interest: ProspectInterest.FlexUsoPlus, stage: ProspectStage.New,
    assignedTo: 'user_3', branch: Branch.Barracas, dni: encrypt('43210987'), address: encrypt('Plaza Moreno 14'), // Assigned to seller from another branch for demo
    notes: encrypt('Ex-socio, quiere volver.'), createdAt: yesterday.toISOString(), updatedAt: yesterday.toISOString(),
    nextActionDate: tomorrow.toISOString(), createdBy: 'user_3', updatedBy: 'user_3'
  },
];

export const mockMembers: Member[] = [
  {
    id: 'member_1', name: 'Juan Perez', plan: ProspectInterest.LocalAnnual1Pago, fee: 5000, status: MemberStatus.Active,
    startDate: lastMonth.toISOString(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    originalSeller: 'user_3', branch: Branch.Barracas, dni: encrypt('45678901'), address: encrypt('Plaza Central 10'),
    notes: encrypt('Convertido desde prospecto. Notas originales: Se inscribió al plan anual.'), createdAt: lastMonth.toISOString(), updatedAt: lastMonth.toISOString()
  },
  {
    id: 'member_2', name: 'Sofia Rodriguez', plan: ProspectInterest.Plus, fee: 7000, status: MemberStatus.Overdue,
    startDate: new Date(Date.now() - 45 * 86400000).toISOString(), endDate: new Date(Date.now() - 15 * 86400000).toISOString(),
    originalSeller: 'user_2', branch: Branch.Paraguay, dni: encrypt('67890123'), address: encrypt('Avenida de Mayo 500'),
    notes: encrypt('Debe la cuota de este mes.'), createdAt: new Date(Date.now() - 45 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'member_3', name: 'Mateo Diaz', plan: ProspectInterest.Local, fee: 4500, status: MemberStatus.Active,
    startDate: tenDaysAgo.toISOString(), endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    originalSeller: 'user_3', branch: Branch.Barracas, dni: encrypt('65432109'), address: encrypt('Avenida del Sol 321'),
    notes: encrypt('Convertido desde prospecto. Se inscribió al plan local.'), createdAt: tenDaysAgo.toISOString(), updatedAt: tenDaysAgo.toISOString()
  },
];

export const mockTasks: Task[] = [
  { id: 'task_1', title: 'Llamar a Ana Garcia (Paraguay)', type: TaskType.Call, dateTime: today.toISOString(), status: TaskStatus.Pending, relatedTo: 'prospect_1', assignedTo: 'user_2' },
  { id: 'task_2', title: 'Enviar promo a Roberto Sanchez (Barracas)', type: TaskType.WhatsApp, dateTime: tomorrow.toISOString(), status: TaskStatus.Pending, relatedTo: 'prospect_2', assignedTo: 'user_3' },
  { id: 'task_3', title: 'Confirmar clase de prueba Mariana (Paraguay)', type: TaskType.Email, dateTime: yesterday.toISOString(), status: TaskStatus.Done, relatedTo: 'prospect_3', assignedTo: 'user_2' },
  { id: 'task_4', title: 'Seguimiento post-clase (Paraguay)', type: TaskType.Call, dateTime: new Date(Date.now() - 3 * 86400000).toISOString(), status: TaskStatus.Pending, relatedTo: 'prospect_3', assignedTo: 'user_2' },
];

export const mockInteractions: Interaction[] = [
  // Initial notes from mockProspects converted to interactions
  { id: 'int_mock_1', date: yesterday.toISOString(), type: TaskType.Note, summary: 'Preguntó por horarios de la mañana.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_2', relatedTo: 'prospect_1' },
  { id: 'int_mock_2', date: new Date(Date.now() - 2 * 86400000).toISOString(), type: TaskType.Note, summary: 'Quiere un plan personalizado.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_3', relatedTo: 'prospect_2' },
  { id: 'int_mock_3', date: new Date(Date.now() - 5 * 86400000).toISOString(), type: TaskType.Note, summary: 'Viene a la clase de prueba el viernes.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_2', relatedTo: 'prospect_3' },
  { id: 'int_mock_4', date: lastMonth.toISOString(), type: TaskType.Note, summary: 'Se inscribió al plan anual.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_3', relatedTo: 'prospect_4' },
  { id: 'int_mock_5', date: lastMonth.toISOString(), type: TaskType.Note, summary: 'Eligió otro gimnasio por el precio.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_2', relatedTo: 'prospect_5' },
  { id: 'int_mock_6', date: threeDaysAgo.toISOString(), type: TaskType.Note, summary: 'Preguntó por clases de yoga.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_seller_t', relatedTo: 'prospect_6' },
  { id: 'int_mock_8', date: tenDaysAgo.toISOString(), type: TaskType.Note, summary: 'Prueba de crossfit agendada.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_2', relatedTo: 'prospect_8' },
  { id: 'int_mock_9', date: twoWeeksAgo.toISOString(), type: TaskType.Note, summary: 'Se inscribió al plan local.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_3', relatedTo: 'prospect_9' },
  { id: 'int_mock_11', date: yesterday.toISOString(), type: TaskType.Note, summary: 'Ex-socio, quiere volver.', result: 'Nota inicial creada con el prospecto.', doneBy: 'user_3', relatedTo: 'prospect_11' },
  
  // Existing interactions
  { id: 'int_1', date: yesterday.toISOString(), type: TaskType.Email, summary: 'Confirmó clase de prueba para el viernes a las 18hs.', result: 'Positivo', doneBy: 'user_2', relatedTo: 'prospect_3' },
  { id: 'int_2', date: new Date(Date.now() - 2 * 86400000).toISOString(), type: TaskType.Call, summary: 'Llamada inicial, se envió info por WhatsApp.', result: 'Interesado', doneBy: 'user_3', relatedTo: 'prospect_2' },
];