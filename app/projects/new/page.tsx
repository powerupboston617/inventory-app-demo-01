import { ProjectForm } from "@/components/ProjectForm";

export const metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">New project</h1>
        <p className="mt-1 text-sm text-mute">
          A client job you want to track inventory against.
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-6">
        <ProjectForm />
      </div>
    </div>
  );
}
