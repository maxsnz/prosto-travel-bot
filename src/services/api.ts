import fetch from "node-fetch";
import env from "../config/env";

export interface ApiConfig {
  baseUrl: string;
  retries?: number;
  delayMs?: number;
  headers?: Record<string, string>;
}

export class ApiClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig) {
    this.config = {
      retries: 3,
      delayMs: 2000,
      headers: {},
      ...config,
    };
  }

  async request<T>(endpoint: string): Promise<T> {
    const { retries, delayMs } = this.config;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Prepare headers with authorization
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...this.config.headers,
        };

        // Add Bearer token if available
        if (env.STRAPI_TOKEN) {
          headers["Authorization"] = `Bearer ${env.STRAPI_TOKEN}`;
        }

        const res = await fetch(url, {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status} - ${res.statusText}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        console.error(
          `API request failed ${endpoint} (attempt ${attempt}/${retries}):`,
          err
        );

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw err;
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts`);
  }

  // Method for POST requests with body
  async post<T>(endpoint: string, data: any): Promise<T> {
    const { retries, delayMs } = this.config;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Prepare headers with authorization
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...this.config.headers,
        };

        // Add Bearer token if available
        if (env.STRAPI_TOKEN) {
          headers["Authorization"] = `Bearer ${env.STRAPI_TOKEN}`;
        }

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status} - ${res.statusText}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        console.error(
          `API POST request failed ${endpoint} (attempt ${attempt}/${retries}):`,
          err
        );

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw err;
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts`);
  }

  // Method for PUT requests
  async put<T>(endpoint: string, data: any): Promise<T> {
    const { retries, delayMs } = this.config;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Prepare headers with authorization
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...this.config.headers,
        };

        // Add Bearer token if available
        if (env.STRAPI_TOKEN) {
          headers["Authorization"] = `Bearer ${env.STRAPI_TOKEN}`;
        }

        const res = await fetch(url, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status} - ${res.statusText}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        console.error(
          `API PUT request failed ${endpoint} (attempt ${attempt}/${retries}):`,
          err
        );

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw err;
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts`);
  }

  // Method for DELETE requests
  async delete<T>(endpoint: string): Promise<T> {
    const { retries, delayMs } = this.config;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Prepare headers with authorization
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...this.config.headers,
        };

        // Add Bearer token if available
        if (env.STRAPI_TOKEN) {
          headers["Authorization"] = `Bearer ${env.STRAPI_TOKEN}`;
        }

        const res = await fetch(url, {
          method: "DELETE",
          headers,
        });

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status} - ${res.statusText}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        console.error(
          `API DELETE request failed ${endpoint} (attempt ${attempt}/${retries}):`,
          err
        );

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          throw err;
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts`);
  }
}

// Create API instance
export const apiClient = new ApiClient({
  baseUrl: `${env.STRAPI_HOST}/api`,
});
