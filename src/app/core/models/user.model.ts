export interface User {
  id?: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleName: string;
  roleId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: number;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleId?: number;
  isActive?: boolean;
}