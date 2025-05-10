import http from "@/lib/http";
import { HomeResType } from "@/schema/home.schema"; // đúng đường dẫn file zod của bạn nhé

export const getHomeData = async () => {
  const res = await http.get<any>("/api/home-page");
  return res.payload; 
};
