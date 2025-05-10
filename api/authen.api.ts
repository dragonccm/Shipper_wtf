import http from "@/lib/http";

const AuthenApiRequest = {
  register: async (phone: string, password: string) => {
    console.log('API Call - Register:', { phone });
    const response = await http.post<any>("/api/register_phone", { phone, password });
    console.log('API Response - Register:', response);
    return response;
  },

  login: async (valueLogin: string, password: string) => {
    console.log('API Call - Login:', { valueLogin });
    const response = await http.post("/api/login_phone", { valueLogin, password });
    console.log('API Response - Login:', response);
    return response;
  },

  getProfile: async () => {
    console.log('API Call - Get Profile');
    const response = await http.get("/api/account/profile");
    console.log('API Response - Get Profile:', response);
    return response;
  }
};

export default AuthenApiRequest;