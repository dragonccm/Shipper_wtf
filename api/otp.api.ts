import http from "@/lib/http";
  const OtpApiRequest = {
    send: (phone:string) => http.post<any>("/api/send-otp",{phone}),
    verify: (phone:string,otp:string) => http.post<any>("/api/verify-otp",{phone,otp}),

  };
  
  export default OtpApiRequest;