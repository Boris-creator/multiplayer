import { HttpService } from "@/services/httpService";
import { setState } from "@/store";

const parseJwt = (token: string): Record<string, any> | null => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
};

export class AuthService {
  static async logIn(credentials: { login: string; password: string }) {
    const { login, password } = credentials;
    const response = await HttpService.post("api/login", {
      username: login,
      password: password,
    });
    if (!response.ok) {
      throw new Error();
    }
    const token = response.headers.get("Authorization")?.split(" ")[1];
    if (token) {
      setState("token", () => token);
      setState("user", parseJwt(token));
    }
  }
}
