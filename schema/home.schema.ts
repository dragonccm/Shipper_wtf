import z from "zod";
export const HomeRes = z.object({
    EM: z.string(),
    EC: z.string(),
    DT: z.array(
      z.object({
        _id: z.string(),
        name: z.string(),
        address: z.union([
          z.string(),
          z.object({
            location: z.object({
              type: z.literal("Point"),
              coordinates: z.array(z.number()),
            }),
            fullAddress: z.string(),
            street: z.string(),
            district: z.string(),
            city: z.string(),
          }),
        ]),
        rating: z.union([
          z.number(),
          z.object({
            average: z.number(),
            count: z.number(),
            total: z.number(),
          }),
        ]),
      })
    ),
  });
export type HomeResType = z.TypeOf<typeof HomeRes>;
export const CreateCateBody = z.object({
  name: z.string().min(2, {
    message: "Tên món phải có ít nhất 2 ký tự",
  }),
  price: z.number().min(1, {
    message: "Vui lòng nhập giá",
  }),
  category: z.string().nonempty("Vui lòng chọn danh mục"),
  description: z.string(),
  availability: z.string().nonempty("Vui lòng chọn thời gian bán"),
  image: z.string(),
});

export type CreateCateBodyType = z.TypeOf<typeof CreateCateBody>;

export const CateSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string(),
  category: z.string(),
  group_food: z.string(),
  state: z.number(),
  availability: z.array(
    z.object({
      day: z.number().min(0).max(6),
      allDay: z.boolean(),
      timeSlots: z.array(
        z.object({
          start: z.string(),
          end: z.string(),
        })
      ),
    })
  ),
  image: z.string(),
});
export type EditCateBodyType = z.TypeOf<typeof CateSchema>;


