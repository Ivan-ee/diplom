/** User data safe for client exposure. Excludes passwordHash and updatedAt. */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
}
