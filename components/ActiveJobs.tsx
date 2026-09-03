import Link from "next/link";
import { FolderKanban } from "lucide-react";

type Job = {
  id: string;
  name: string;
  client: string | null;
};

export function ActiveJobs({
  jobs,
  activeId,
}: {
  jobs: Job[];
  activeId?: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-navy">Active jobs</h2>
        <FolderKanban className="h-4 w-4 text-mute" />
      </div>
      {jobs.length === 0 ? (
        <p className="text-sm text-mute">
          No active jobs.{" "}
          <Link href="/projects" className="font-medium text-blue">
            Projects
          </Link>
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {jobs.map((job) => {
            const selected = activeId === job.id;
            return (
              <Link
                key={job.id}
                href={`/?project=${job.id}`}
                className={`inline-flex min-h-11 shrink-0 flex-col justify-center rounded-2xl px-3 py-2 ring-1 ${
                  selected
                    ? "bg-navy text-white ring-navy"
                    : "bg-white text-navy ring-black/5"
                }`}
              >
                <span className="text-sm font-semibold">{job.name}</span>
                {job.client ? (
                  <span
                    className={`text-xs ${selected ? "text-sky" : "text-mute"}`}
                  >
                    {job.client}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
