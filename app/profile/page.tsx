import { Card } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Card className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-sm text-slate-600">Access your profile, order history, and checkout.</p>
        <AuthForm />
      </Card>
    );
  }

  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">{user.name || "User"}</p>
        <p className="text-sm text-slate-600">{user.email}</p>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="mt-4 space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-500">{order.status}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
