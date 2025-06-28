import { apiClient } from "./api";
import { User, CreateUserParams } from "./types";

export class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async findOrCreateUser(params: CreateUserParams): Promise<User> {
    const { telegramId, username, firstName, email } = params;

    // Try to find existing user first
    const existingUser = await this.getUserByTelegramId(telegramId);
    if (existingUser) {
      return existingUser;
    }

    // Create new user
    const response = await apiClient.post<User>("/telegram-user", {
      telegramId: telegramId.toString(),
      username,
      firstName,
      email,
    });

    const user: User = {
      id: response.id,
      telegramId: response.telegramId,
      username: response.username,
      firstName: response.firstName,
      email: response.email,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };

    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const response = await apiClient.request<User>(`/users/${id}`);

      const user: User = {
        id: response.id,
        telegramId: response.telegramId,
        username: response.username,
        firstName: response.firstName,
        email: response.email,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      return user;
    } catch (error) {
      console.error(`Failed to get user by ID ${id}:`, error);
      return null;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<User | null> {
    try {
      const response = await apiClient.request<User[]>(
        `/users?filters[telegramId][$eq]=${telegramId}`
      );

      if (!response || response.length === 0) {
        return null;
      }

      const userData = response[0];
      const user: User = {
        id: userData.id,
        telegramId: userData.telegramId,
        username: userData.username,
        firstName: userData.firstName,
        email: userData.email,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      return user;
    } catch (error) {
      console.error(`Failed to get user by Telegram ID ${telegramId}:`, error);
      return null;
    }
  }
}

// Export singleton
export const userService = UserService.getInstance();
