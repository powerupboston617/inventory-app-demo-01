"use client";

import { useState, useTransition } from "react";
import { Camera, Plus, ScanLine, Sparkles } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { fillFromPhoto, suggestCategory } from "@/lib/actions-ai";
import { createItemName, createManufacturer } from "@/lib/actions-catalog";
import { createCategory, createItem, createProjectQuick, updateItem } from "@/lib/actions";
import {
  CONDITIONS,
  ITEM_STATUSES,
  LOCATIONS,
  type ConditionValue,
  type ItemStatusValue,
  type LocationValue,
} from "@/lib/constants";
import { CONDITION_LABEL, STATUS_LABEL } from "@/lib/labels";

const fieldClass =
  "w-full min-h-12 rounded-xl border border-gray-200 bg-white px-4 text-base text-navy placeholder:text-mute focus:border-blue focus:outline-none focus:ring-2 focus:ring-sky";
const labelClass = "mb-1.5 block text-sm font-medium text-navy";

export type ItemFormCategory = { id: string; name: string };
export type ItemFormProject = { id: string; name: string; client: string | null };
export type ItemFormValues = {
  id: string;
  name: string;
  manufacturer: string | null;
  serialNumber: string | null;
  quantity: number;
  reorderPoint: number;
  location: LocationValue;
  status: ItemStatusValue;
  condition: ConditionValue;
  price: number | null;
  photoUrl: string | null;
  notes: string | null;
  itemNameId: string | null;
  manufacturerId: string | null;
  categoryId: string | null;
  projectId: string | null;
};

export function ItemForm({
  item,
  itemNames,
  manufacturers,
  categories,
  projects,
  initialSerial,
  aiEnabled = false,
}: {
  item?: ItemFormValues;
  itemNames: ItemFormCategory[];
  manufacturers: ItemFormCategory[];
  categories: ItemFormCategory[];
  projects: ItemFormProject[];
  initialSerial?: string;
  aiEnabled?: boolean;
}) {
  const [names, setNames] = useState(itemNames);
  const [makers, setMakers] = useState(manufacturers);
  const [cats, setCats] = useState(categories);
  const [projs, setProjs] = useState(projects);
  const [itemNameId, setItemNameId] = useState(item?.itemNameId ?? "");
  const [manufacturerId, setManufacturerId] = useState(item?.manufacturerId ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [projectId, setProjectId] = useState(item?.projectId ?? "");
  const [showNewName, setShowNewName] = useState(false);
  const [showNewMaker, setShowNewMaker] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showNewProj, setShowNewProj] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMaker, setNewMaker] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newProjName, setNewProjName] = useState("");
  const [newProjClient, setNewProjClient] = useState("");
  const [photoPreview, setPhotoPreview] = useState(item?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [serialNumber, setSerialNumber] = useState(
    item?.serialNumber ?? initialSerial ?? "",
  );
  const [scanOpen, setScanOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [photoHint, setPhotoHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [namePending, setNamePending] = useState(false);
  const [makerPending, setMakerPending] = useState(false);
  const [catPending, setCatPending] = useState(false);
  const [projPending, setProjPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = item
        ? await updateItem(item.id, formData)
        : await createItem(formData);
      if (result?.error) setError(result.error);
    });
  }

  function sortByName(list: ItemFormCategory[]) {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }

  async function addItemName() {
    setNamePending(true);
    const result = await createItemName(newName);
    setNamePending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNames((prev) =>
      prev.some((row) => row.id === result.id)
        ? prev
        : sortByName([...prev, { id: result.id, name: result.name }]),
    );
    setItemNameId(result.id);
    setNewName("");
    setShowNewName(false);
    setError(null);
  }

  async function addManufacturer() {
    setMakerPending(true);
    const result = await createManufacturer(newMaker);
    setMakerPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMakers((prev) =>
      prev.some((row) => row.id === result.id)
        ? prev
        : sortByName([...prev, { id: result.id, name: result.name }]),
    );
    setManufacturerId(result.id);
    setNewMaker("");
    setShowNewMaker(false);
    setError(null);
  }

  async function addCategory() {
    setCatPending(true);
    const result = await createCategory(newCat);
    setCatPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCats((prev) =>
      [...prev, { id: result.id, name: result.name }].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setCategoryId(result.id);
    setNewCat("");
    setShowNewCat(false);
    setError(null);
  }

  async function addProject() {
    setProjPending(true);
    const result = await createProjectQuick(newProjName, newProjClient);
    setProjPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setProjs((prev) => [
      { id: result.id, name: result.name, client: result.client ?? null },
      ...prev,
    ]);
    setProjectId(result.id);
    setNewProjName("");
    setNewProjClient("");
    setShowNewProj(false);
    setError(null);
  }

  function closestCategory(label: string) {
    const n = label.trim().toLowerCase();
    if (!n) return null;
    const exact = cats.find((c) => c.name.toLowerCase() === n);
    if (exact) return exact;
    return (
      cats.find(
        (c) =>
          n.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(n),
      ) ?? null
    );
  }

  async function applyPhotoFill() {
    setError(null);
    setPhotoHint(null);
    if (!photoFile && !item?.photoUrl) return;
    const formData = new FormData();
    if (photoFile) formData.set("photo", photoFile);
    if (item?.photoUrl) formData.set("photoUrl", item.photoUrl);
    setReadingPhoto(true);
    const result = await fillFromPhoto(formData);
    setReadingPhoto(false);
    if (result.error || !result.suggestion) {
      setError("Couldn’t read this photo. Enter the name manually.");
      return;
    }
    const suggestion = result.suggestion;
    const nameResult = await createItemName(suggestion.name);
    if (nameResult.ok) {
      setNames((prev) =>
        prev.some((row) => row.id === nameResult.id)
          ? prev
          : sortByName([...prev, { id: nameResult.id, name: nameResult.name }]),
      );
      setItemNameId(nameResult.id);
    }
    if (suggestion.manufacturer) {
      const makerResult = await createManufacturer(suggestion.manufacturer);
      if (makerResult.ok) {
        setMakers((prev) =>
          prev.some((row) => row.id === makerResult.id)
            ? prev
            : sortByName([
                ...prev,
                { id: makerResult.id, name: makerResult.name },
              ]),
        );
        setManufacturerId(makerResult.id);
      }
    }
    const cat = closestCategory(suggestion.category);
    if (cat) setCategoryId(cat.id);
    if (suggestion.notes && !notes.trim()) setNotes(suggestion.notes);
    setPhotoHint(
      suggestion.confidence === "low"
        ? "Suggested from photo — confidence is low. Review before saving."
        : "Suggested from photo — review before saving.",
    );
  }

  const hasPhoto = Boolean(photoPreview);

  return (
    <form action={onSubmit} className="space-y-5">
      <div>
        <p className={labelClass}>Photo</p>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white text-sm text-mute">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Item photo preview"
              className="h-44 w-full object-cover"
            />
          ) : (
            <span className="flex flex-col items-center gap-2 py-6">
              <Camera className="h-7 w-7 text-navy" />
              Tap to add a photo
            </span>
          )}
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const url = URL.createObjectURL(file);
              setPhotoFile(file);
              setPhotoPreview(url);
              setPhotoHint(null);
            }}
          />
        </label>
        {aiEnabled && hasPhoto ? (
          <button
            type="button"
            disabled={readingPhoto}
            onClick={applyPhotoFill}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange px-4 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
          >
            {readingPhoto ? "Reading photo…" : "Fill from photo"}
          </button>
        ) : null}
        {photoHint ? (
          <p className="mt-2 text-sm text-navy">{photoHint}</p>
        ) : null}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="itemNameId" className="text-sm font-medium text-navy">
            Name <span className="text-orange">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowNewName((v) => !v)}
            className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-blue"
          >
            <Plus className="h-3.5 w-3.5" />
            New name
          </button>
        </div>
        <select
          id="itemNameId"
          name="itemNameId"
          required
          value={itemNameId}
          onChange={(e) => setItemNameId(e.target.value)}
          className={fieldClass}
        >
          <option value="">Select a name</option>
          {names.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        {showNewName ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Item name"
              className={fieldClass}
            />
            <button
              type="button"
              disabled={namePending}
              onClick={addItemName}
              className="min-h-12 shrink-0 rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {namePending ? "Saving…" : "Save"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="manufacturerId" className="text-sm font-medium text-navy">
              Manufacturer
            </label>
            <button
              type="button"
              onClick={() => setShowNewMaker((v) => !v)}
              className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-blue"
            >
              <Plus className="h-3.5 w-3.5" />
              New manufacturer
            </button>
          </div>
          <select
            id="manufacturerId"
            name="manufacturerId"
            value={manufacturerId}
            onChange={(e) => setManufacturerId(e.target.value)}
            className={fieldClass}
          >
            <option value="">None</option>
            {makers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          {showNewMaker ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={newMaker}
                onChange={(e) => setNewMaker(e.target.value)}
                placeholder="Manufacturer"
                className={fieldClass}
              />
              <button
                type="button"
                disabled={makerPending}
                onClick={addManufacturer}
                className="min-h-12 shrink-0 rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {makerPending ? "Saving…" : "Save"}
              </button>
            </div>
          ) : null}
        </div>
        <div>
          <label htmlFor="serialNumber" className={labelClass}>
            Serial number
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="serialNumber"
              name="serialNumber"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Optional"
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-navy px-4 text-sm font-semibold text-white"
            >
              <ScanLine className="h-4 w-4" />
              Scan barcode
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="quantity" className={labelClass}>
            Quantity <span className="text-orange">*</span>
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={item?.quantity ?? 1}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-mute">
            Use quantity for bulk parts like cables, connectors, and mounts.
          </p>
        </div>
        <div>
          <label htmlFor="reorderPoint" className={labelClass}>
            Low stock at
          </label>
          <input
            id="reorderPoint"
            name="reorderPoint"
            type="number"
            min={0}
            step={1}
            defaultValue={item?.reorderPoint ?? 0}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-mute">
            Flagged when quantity hits this number.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="location" className={labelClass}>
            Location
          </label>
          <select
            id="location"
            name="location"
            defaultValue={item?.location ?? "Shop"}
            className={fieldClass}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={item?.status ?? "InStock"}
            className={fieldClass}
          >
            {ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className={labelClass}>
            Condition
          </label>
          <select
            id="condition"
            name="condition"
            defaultValue={item?.condition ?? "New"}
            className={fieldClass}
          >
            {CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {CONDITION_LABEL[condition]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="price" className={labelClass}>
          Price
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min={0}
          step="0.01"
          defaultValue={item?.price ?? ""}
          placeholder="Optional"
          className={fieldClass}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="categoryId" className="text-sm font-medium text-navy">
            Category
          </label>
          <div className="flex items-center gap-3">
            {aiEnabled && !item ? (
              <button
                type="button"
                disabled={suggesting}
                onClick={async () => {
                  const nameSelect = document.getElementById(
                    "itemNameId",
                  ) as HTMLSelectElement | null;
                  const makerSelect = document.getElementById(
                    "manufacturerId",
                  ) as HTMLSelectElement | null;
                  const notes = document.getElementById("notes") as HTMLTextAreaElement | null;
                  const selectedName =
                    nameSelect?.selectedOptions[0]?.text &&
                    nameSelect.value
                      ? nameSelect.selectedOptions[0].text
                      : "";
                  const selectedMaker =
                    makerSelect?.value && makerSelect.selectedOptions[0]
                      ? makerSelect.selectedOptions[0].text
                      : "";
                  setSuggesting(true);
                  const result = await suggestCategory({
                    name: selectedName,
                    manufacturer: selectedMaker,
                    notes: notes?.value,
                  });
                  setSuggesting(false);
                  if (result.error === "Enter a name first.") {
                    setError(result.error);
                    return;
                  }
                  if (!result.name) return;
                  const existing = cats.find(
                    (cat) => cat.name.toLowerCase() === result.name!.toLowerCase(),
                  );
                  if (existing) {
                    setCategoryId(existing.id);
                    return;
                  }
                  const created = await createCategory(result.name);
                  if (created.ok) {
                    setCats((prev) =>
                      [...prev, { id: created.id, name: created.name }].sort((a, b) =>
                        a.name.localeCompare(b.name),
                      ),
                    );
                    setCategoryId(created.id);
                  }
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {suggesting ? "Suggesting…" : "Suggest category"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowNewCat((v) => !v)}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue"
            >
              <Plus className="h-3.5 w-3.5" />
              New category
            </button>
          </div>
        </div>
        <select
          id="categoryId"
          name="categoryId"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={fieldClass}
        >
          <option value="">None</option>
          {cats.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {showNewCat ? (
          <div className="mt-2 flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Category name"
              className={fieldClass}
            />
            <button
              type="button"
              disabled={catPending}
              onClick={addCategory}
              className="min-h-12 shrink-0 rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {catPending ? "Saving…" : "Save"}
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="projectId" className="text-sm font-medium text-navy">
            Project
          </label>
          <button
            type="button"
            onClick={() => setShowNewProj((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </button>
        </div>
        <select
          id="projectId"
          name="projectId"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className={fieldClass}
        >
          <option value="">None</option>
          {projs.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.client ? ` · ${project.client}` : ""}
            </option>
          ))}
        </select>
        {showNewProj ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="Project name"
              className={fieldClass}
            />
            <input
              value={newProjClient}
              onChange={(e) => setNewProjClient(e.target.value)}
              placeholder="Client (optional)"
              className={fieldClass}
            />
            <button
              type="button"
              disabled={projPending}
              onClick={addProject}
              className="min-h-12 rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {projPending ? "Saving…" : "Save"}
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the team should know"
          className={`${fieldClass} py-3`}
        />
      </div>

      {error ? (
        <p className="rounded-xl bg-orange/10 px-4 py-3 text-sm font-medium text-orange">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange text-base font-semibold text-white hover:bg-orange/90 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Saving…" : item ? "Save changes" : "Add item"}
      </button>
      {scanOpen ? (
        <BarcodeScanner
          onResult={(text) => {
            setSerialNumber(text);
            setScanOpen(false);
          }}
          onClose={() => setScanOpen(false)}
        />
      ) : null}
    </form>
  );
}
