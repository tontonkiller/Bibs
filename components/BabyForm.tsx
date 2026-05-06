"use client";

import { useState } from "react";
import type { Baby, NewBaby } from "@/lib/types";
import type { UpdateBabyChanges } from "@/lib/babies";

type CreateMode = {
  kind: "create";
  onSubmit: (input: NewBaby) => Promise<void> | void;
};

type EditMode = {
  kind: "edit";
  baby: Baby;
  /** Returns false on bad current password (form will display error). */
  onSubmit: (
    currentPassword: string,
    changes: UpdateBabyChanges,
  ) => Promise<boolean>;
};

type Props = (CreateMode | EditMode) & {
  submitting?: boolean;
  onCancel?: () => void;
};

export function BabyForm(props: Props) {
  const initial = props.kind === "edit" ? props.baby : null;
  const [name, setName] = useState(initial?.name ?? "");
  const [birthdate, setBirthdate] = useState(initial?.birthdate ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isCreate = props.kind === "create";
  const wantsPasswordChange = !isCreate && newPassword.length > 0;

  function validate(): string | null {
    if (!name.trim()) return "Le prénom est obligatoire.";
    if (!birthdate) return "La date de naissance est obligatoire.";
    if (isCreate) {
      if (newPassword.length < 4) {
        return "Le mot de passe doit faire au moins 4 caractères.";
      }
      if (newPassword !== confirmNew) {
        return "Les deux mots de passe ne correspondent pas.";
      }
    } else {
      if (currentPassword.length === 0) {
        return "Saisis le mot de passe actuel pour valider la modification.";
      }
      if (wantsPasswordChange) {
        if (newPassword.length < 4) {
          return "Le nouveau mot de passe doit faire au moins 4 caractères.";
        }
        if (newPassword !== confirmNew) {
          return "Les deux nouveaux mots de passe ne correspondent pas.";
        }
      }
    }
    return null;
  }

  async function submit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    if (props.kind === "create") {
      await props.onSubmit({
        name: name.trim(),
        birthdate,
        password: newPassword,
      });
      return;
    }

    const changes: UpdateBabyChanges = {};
    if (name.trim() !== props.baby.name) changes.name = name.trim();
    if (birthdate !== props.baby.birthdate) changes.birthdate = birthdate;
    if (wantsPasswordChange) changes.newPassword = newPassword;

    const ok = await props.onSubmit(currentPassword, changes);
    if (!ok) {
      setError("Mot de passe actuel incorrect.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--color-ink-soft)">Prénom</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
          placeholder="Ex. Jeanne"
          className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--color-ink-soft)">Date de naissance</span>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
        />
      </label>

      {!isCreate && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-(--color-ink-soft)">
            Mot de passe actuel
          </span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--color-ink-soft)">
          {isCreate
            ? "Mot de passe (min. 4 caractères)"
            : "Nouveau mot de passe (laisse vide pour ne pas changer)"}
        </span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
        />
      </label>

      {(isCreate || wantsPasswordChange) && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-(--color-ink-soft)">
            Confirme le mot de passe
          </span>
          <input
            type="password"
            value={confirmNew}
            onChange={(e) => setConfirmNew(e.target.value)}
            autoComplete="new-password"
            className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
          />
        </label>
      )}

      {error && (
        <p className="rounded-2xl bg-(--color-rose) px-4 py-2 text-sm">{error}</p>
      )}

      <div className="flex gap-3">
        {props.onCancel && (
          <button
            type="button"
            onClick={props.onCancel}
            disabled={props.submitting}
            className="flex-1 rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 font-medium text-(--color-ink) disabled:opacity-50"
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={props.submitting}
          className="flex-1 rounded-2xl bg-(--color-rose-strong) px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {props.submitting
            ? "Enregistrement…"
            : isCreate
              ? "Créer le bébé"
              : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
