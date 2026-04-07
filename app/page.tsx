import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";

type HomeProps = {
  searchParams: Promise<{ q?: string; category?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  const category = params.category?.trim();

  const products = await db.product.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(category ? { category } : {})
    },
    orderBy: { createdAt: "desc" }
  });

  const categories = await db.product.findMany({
    select: { category: true },
    distinct: ["category"]
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-rose-100 to-white p-8">
        <p className="text-sm uppercase tracking-widest text-brand">Premium Collection</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">VNS Store</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Discover curated essentials with modern design and clean craftsmanship.
        </p>
      </section>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:grid-cols-[1fr_200px_auto]">
        <input
          name="q"
          placeholder="Search products..."
          defaultValue={q}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <select
          name="category"
          defaultValue={category || ""}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.category} value={item.category}>
              {item.category}
            </option>
          ))}
        </select>
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white">
          Filter
        </button>
      </form>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </div>
  );
}
