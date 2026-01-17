export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
};

export const products: Product[] = [
  {
    id: "pizza_margherita",
    name: "Pizza Margherita",
    price: 189.9,
    image: "/images/pizza.svg"
  },
  {
    id: "su_1_5l",
    name: "Su 1.5L",
    price: 14.9,
    image: "/images/water.svg"
  },
  {
    id: "sut_1l",
    name: "Süt 1L",
    price: 24.9,
    image: "/images/milk.svg"
  }
];
