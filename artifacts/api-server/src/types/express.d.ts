import "express";

declare global {
  namespace Express {
    interface User {
      id: number;
      role: "user" | "admin";
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      email?: string | null;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
