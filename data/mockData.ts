import { Role, Prospect, Member, Task, Interaction, Branch } from '../types';
import { hashPassword } from '../services/encryptionService';

const adminPasswordHash = hashPassword('Lu23101996');

// NOTE: The mockUsers array includes the 'password' hash for the mock API to function.
// The API layer is responsible for stripping this property before sending any user
// object to the client, conforming to the `User` type defined in `types.ts`.
export const mockUsers: any[] = [
  { id: 'user_admin_main', name: 'Admin', email: 'lucasrondanorte@gmail.com', role: Role.Admin, branch: Branch.Paraguay, password: adminPasswordHash },
];

export const mockProspects: Prospect[] = [];

export const mockMembers: Member[] = [];

export const mockTasks: Task[] = [];

export const mockInteractions: Interaction[] = [];
