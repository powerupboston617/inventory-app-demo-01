import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Projects</h1>
          <p className="mt-1 text-sm text-mute">
            Client jobs and where the gear is assigned.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-orange px-4 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          New
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project for a client job so you can assign cameras, switches, and parts to it."
          actionHref="/projects/new"
          actionLabel="Create project"
        />
      ) : (
        <ul className="grid gap-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-navy">
                      {project.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-mute">
                      {project.client || "No client listed"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      project.status === "Active"
                        ? "bg-sky/25 text-navy"
                        : "bg-gray-100 text-mute"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-navy">
                  {project._count.items}{" "}
                  {project._count.items === 1 ? "item" : "items"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
