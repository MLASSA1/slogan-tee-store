export type Product = {
  id: string;
  name: string;
  shortName: string;
  quote: string;
  colour: string;
  colourOptions: string[];
  price: number;
  role: string;
  image: string;
  images?: Record<string, string>;
  position: string;
  number: string;
  description: string;
};

export type CartItem = {
  key: string;
  product: Product;
  size: string;
  colour: string;
  quantity: number;
};

export const sizes = ["S", "M", "L", "XL", "XXL"];

export const products: Product[] = [
  {
    id: "just-kiss-me",
    name: "Just Kiss Me Tee",
    shortName: "Just Kiss Me",
    quote: "JUST KISS ME / WE CAN TALK LATER",
    colour: "Bone / Statement Red",
    colourOptions: ["Bone", "Washed Ink Black"],
    price: 279,
    role: "Hero design",
    image: "/images/product-just-kiss-solo.jpg",
    images: {
      Bone: "/images/product-just-kiss-solo.jpg",
      "Washed Ink Black": "/images/product-just-kiss-black.jpg",
    },
    position: "center",
    number: "01 / 06",
    description:
      "The hero statement of OUT LOUD: direct, flirtatious and impossible to misunderstand. Printed large across the upper back.",
  },
  {
    id: "break-her-bed",
    name: "Break Her Bed Tee",
    shortName: "Break Her Bed",
    quote: "BREAK HER BED / NOT HER HEART",
    colour: "Washed Ink Black / Warm Off-White",
    colourOptions: ["Washed Ink Black", "Bone"],
    price: 299,
    role: "Conversation starter",
    image: "/images/product-break-solo.jpg",
    images: {
      "Washed Ink Black": "/images/product-break-solo.jpg",
      Bone: "/images/product-break-bone.jpg",
    },
    position: "center",
    number: "02 / 06",
    description:
      "The collection's sharpest dating line. A bold, tactile back print on a heavyweight boxy tee.",
  },
  {
    id: "simple-man",
    name: "Simple Man Tee",
    shortName: "Simple Man",
    quote: "I LOVE MY WIFE / AND MAX VERSTAPPEN",
    colour: "Bone / Olive Ink",
    colourOptions: ["Bone", "Washed Ink Black"],
    price: 279,
    role: "Niche collector",
    image: "/images/product-simple-solo.jpg",
    images: {
      Bone: "/images/product-simple-solo.jpg",
      "Washed Ink Black": "/images/product-simple-black.jpg",
    },
    position: "center",
    number: "03 / 06",
    description:
      "For the loyal ones with one very specific obsession. A collector statement made for race weekends and every day after.",
  },
  {
    id: "afraid-of-boobs",
    name: "Afraid Tee",
    shortName: "Afraid",
    quote: "IF YOU TRYNA SCARE ME / I AM AFRAID OF BOOBS",
    colour: "Washed Ink Black / Warm Off-White",
    colourOptions: ["Washed Ink Black", "Bone"],
    price: 299,
    role: "Provocative core",
    image: "/images/product-afraid-solo.jpg",
    images: {
      "Washed Ink Black": "/images/product-afraid-solo.jpg",
      Bone: "/images/product-afraid-bone.jpg",
    },
    position: "center",
    number: "04 / 06",
    description:
      "Playfully provocative, deliberately unfiltered. The message is oversized, centred and screen printed with an imperfect hand-made edge.",
  },
  {
    id: "date-them",
    name: "Date Them Tee",
    shortName: "Date Them",
    quote: "I DON'T MAKE MISTAKES / I DATE THEM",
    colour: "Bone / Royal Blue",
    colourOptions: ["Bone", "Washed Ink Black"],
    price: 279,
    role: "Commercial core",
    image: "/images/product-date-them-solo.jpg",
    images: {
      Bone: "/images/product-date-them-solo.jpg",
      "Washed Ink Black": "/images/product-date-them-black.svg",
    },
    position: "center",
    number: "05 / 06",
    description:
      "A private thought with public confidence. Clean enough for daily rotation, sharp enough to start the conversation.",
  },
  {
    id: "marry-moroccan",
    name: "Marry Moroccan Tee",
    shortName: "Marry Moroccan",
    quote: "EAT ITALIEN / DRIVE GERMAN / MARRY MOROCCAN",
    colour: "Bone / Periwinkle Blue",
    colourOptions: ["Bone", "Washed Ink Black"],
    price: 279,
    role: "Moroccan signature",
    image: "/images/product-marry-moroccan-solo.jpg",
    images: {
      Bone: "/images/product-marry-moroccan-solo.jpg",
      "Washed Ink Black": "/images/product-marry-moroccan-black.jpg",
    },
    position: "center",
    number: "06 / 06",
    description:
      "International taste, Moroccan conclusion. A local signature delivered with global streetwear energy.",
  },
];

export const sizeChart = [
  { size: "S", chest: 56, length: 68, shoulder: 53, sleeve: 22 },
  { size: "M", chest: 59, length: 70, shoulder: 55, sleeve: 23 },
  { size: "L", chest: 62, length: 72, shoulder: 57, sleeve: 24 },
  { size: "XL", chest: 65, length: 74, shoulder: 59, sleeve: 25 },
  { size: "XXL", chest: 68, length: 76, shoulder: 61, sleeve: 26 },
];

export function getProduct(id: string) {
  return products.find((product) => product.id === id);
}

export function getProductImage(product: Product, colour?: string) {
  const selectedColour = colour || product.colourOptions?.[0];
  return product.images?.[selectedColour] || product.image;
}
