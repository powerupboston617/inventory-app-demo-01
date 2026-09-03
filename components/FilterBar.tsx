import Link from "next/link";
import { CONDITIONS, ITEM_STATUSES, LOCATIONS } from "@/lib/constants";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/labels";
import type { ItemFilterParams } from "@/lib/utils";
import { hasActiveFilters } from "@/lib/utils";

const fieldClass =
  "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-navy";

type Option = { id: string; name: string };

export function FilterBar({
  action,
  filters,
  categories,
  projects,
  showSearch = true,
  extra,
}: {
  action: string;
  filters: ItemFilterParams;
  categories: Option[];
  projects?: Option[];
  showSearch?: boolean;
  extra?: boolean;
}) {
  const active = hasActiveFilters(filters);

  return (
    <form
      action={action}
      method="get"
      className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
    >
      {showSearch ? (
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ""}
          placeholder="Search name, manufacturer, serial, notes"
          className="mb-3 min-h-12 w-full rounded-xl border border-gray-200 bg-page px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky"
        />
      ) : null}

      <div
        className={
          extra
            ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
            : "grid grid-cols-1 gap-2 sm:grid-cols-2"
        }
      >
        <select
          name="location"
          defaultValue={filters.location ?? ""}
          className={fieldClass}
          aria-label="Location"
        >
          <option value="">All locations</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className={fieldClass}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {extra ? (
          <>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className={fieldClass}
              aria-label="Status"
            >
              <option value="">All statuses</option>
              {ITEM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            <select
              name="condition"
              defaultValue={filters.condition ?? ""}
              className={fieldClass}
              aria-label="Condition"
            >
              <option value="">All conditions</option>
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {CONDITION_LABEL[condition]}
                </option>
              ))}
            </select>
            {projects ? (
              <select
                name="project"
                defaultValue={filters.project ?? ""}
                className={fieldClass}
                aria-label="Project"
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white sm:flex-none"
        >
          Apply
        </button>
        {active ? (
          <Link
            href={action}
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-mute hover:text-navy"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
