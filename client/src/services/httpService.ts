import { BASE_URL } from "@/constants";

export class HttpService {
  static post(url: string, payload?: any, options?: RequestInit) {
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(payload),
      ...options,
    };
    return fetch(BASE_URL + url, requestOptions);
  }
}
