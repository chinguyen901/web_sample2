import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Aero Leather Backpack",
    slug: "aero-leather-backpack",
    description: "Premium everyday backpack with minimalist design and durable construction.",
    price: 129,
    category: "Accessories"
  },
  {
    name: "Nord Ceramic Mug Set",
    slug: "nord-ceramic-mug-set",
    description: "Hand-finished ceramic mugs for coffee rituals and modern kitchens.",
    price: 39,
    category: "Home"
  },
  {
    name: "Pulse Wireless Headphones",
    slug: "pulse-wireless-headphones",
    description: "High-fidelity wireless sound with premium comfort and long battery life.",
    price: 199,
    category: "Tech"
  },
  {
    name: "Luma Desk Lamp",
    slug: "luma-desk-lamp",
    description: "Soft ambient lighting with a precision metal body and touch controls.",
    price: 89,
    category: "Home"
  },
  {
    name: "Forma Running Shoes",
    slug: "forma-running-shoes",
    description: "Lightweight running shoes engineered for support and everyday motion.",
    price: 149,
    category: "Fashion"
  },
  {
    name: "Vera Smart Watch",
    slug: "vera-smart-watch",
    description: "Elegant health-tracking smartwatch with premium stainless steel frame.",
    price: 259,
    category: "Tech"
  }
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
