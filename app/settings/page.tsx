import { redirect } from "next/navigation";
import { AddUserForm, UserRowActions } from "@/components/SettingsForms";
import { getCurrentUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Users" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "Admin") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: [{ disabled: "asc" }, { name: "asc" }],
  });
  const enabledAdmins = users.filter(
    (row) => row.role === "Admin" && !row.disabled,
  );
  const lastAdminId =
    enabledAdmins.length === 1 ? enabledAdmins[0].id : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Users</h1>
        <p className="mt-1 text-sm text-mute">
          Admins manage the team. Techs can use inventory but not this page.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <h2 className="mb-4 text-base font-semibold text-navy">Add user</h2>
        <AddUserForm />
      </section>

      <ul className="space-y-3">
        {users.map((row) => (
          <li
            key={row.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-navy">
                  {row.name}
                  {row.id === user.id ? (
                    <span className="ml-2 text-xs font-medium text-mute">you</span>
                  ) : null}
                </p>
                <p className="text-sm text-mute">{row.email}</p>
                {row.disabled ? (
                  <p className="mt-1 text-xs font-semibold text-orange">Disabled</p>
                ) : null}
              </div>
              <UserRowActions
                id={row.id}
                name={row.name}
                email={row.email}
                role={row.role}
                disabled={row.disabled}
                isSelf={row.id === user.id}
                isLastAdmin={row.id === lastAdminId}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
