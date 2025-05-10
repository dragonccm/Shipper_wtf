import z from "zod";
export const CartRes = z.object({
  EM: z.string(),
  EC: z.string(),
  DT: z.string(),
});
export type CartResType = z.TypeOf<typeof CartRes>;
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

export const CartSchema = z.object({
  foodId: z.string(),
  restaurantId: z.string(),
  totalPrice: z.number(),
  topping: z.object({
    id: z.string(),
    item: z.array(z.string()),
  }),
  quantity: z.number(),
});
export type AddCartBodyType = z.TypeOf<typeof CartSchema>;



const itemSchema = z.object({
  state: z.number(),
  name: z.string(),
  price: z.number(),
  _id: z.string(),
  available: z.boolean(),
});

const toppingIdSchema = z.object({
  option: z.object({
    type: z.number(),
    quantity: z.number(),
  }),
  _id: z.string(),
  name: z.string(),
  item: z.array(itemSchema),
});

const toppingSchema = z.object({
  id: toppingIdSchema,
  item: z.array(itemSchema),
  _id: z.string(),
});

const foodSchema = z.object({
  _id: z.string(),
  name: z.string(),
  image: z.string(),
});

const cartItemSchema = z.object({
  foodId: foodSchema,
  topping: z.array(toppingSchema),
  quantity: z.number(),
  price: z.number(),
});

export const singleCartSchema = z.object({
  items: z.array(cartItemSchema),
  restaurantId: z.string(),
  _id: z.string(),
  user: z.string(),
  totalPrice: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  __v: z.number(),
});

const CartFullRes = z.object({
  EM: z.string(),
  EC: z.string(),
  DT: z.array(singleCartSchema),
});

export type CartFullResType = z.TypeOf<typeof CartFullRes>;
