export interface User {
  id: string;
  email: string;
  role: "guardian" | "dependent";
}