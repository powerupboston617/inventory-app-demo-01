import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { DeleteButton } from "@/components/DeleteButton";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { ProjectForm } from "@/components/ProjectForm";
import { formatDate } from "@/lib/labels";
import { getCurrentUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const project = await prisma.project.findUnique({
    where: { id },
    include: { items: { orderBy: { name: "asc" } } },
  });

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/projects"
        className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-blue"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{project.name}</h1>
          <p className="mt-1 text-sm text-mute">
            Updated {formatDate(project.updatedAt)}
          </p>
        </div>
        {user?.role === "Admin" ? (
          <DeleteButton id={project.id} name={project.name} kind="project" />
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <h2 className="mb-4 text-base font-semibold text-navy">Edit project</h2>
        <ProjectForm project={project} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-navy">Assigned items</h2>
          <Link
            href={`/items?project=${project.id}`}
            className="text-sm font-medium text-blue"
          >
            View in items
          </Link>
        </div>
        {project.items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No items on this job yet"
            description="Open an item and assign it to this project, or add a new item from the van or shop."
            actionHref="/items/new"
            actionLabel="Add item"
          />
        ) : (
          <div className="grid gap-3">
            {project.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
