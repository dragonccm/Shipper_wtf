import http from "@/lib/http";
  const AuthenApiRequest = {
    register: (phone:string,password:string) => http.post<any>("/api/register_phone",{phone,password}),
    login: (valueLogin:string,password:string) => http.post<any>("/api/login_phone",{valueLogin,password}),

  };
  
  export default AuthenApiRequest;