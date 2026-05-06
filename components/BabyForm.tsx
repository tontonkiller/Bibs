"use client";

import { useState } from "react";
import type { Baby, BabyEdit, NewBaby } from "@/lib/types";

type Mode =
  | { kind: "create"; onSubmit: (input: NewBaby) => Promise<void> | void }
  | {
      kind: "edit";
      baby: Baby;
      onSubmit: (
        patch: BabyEdit,
        password: { newPassword: string } | null,
      ) => Promise<void> | void;
    };

type Props = Mode & {
  submitting?: boolean;
  onCancel?: () => void;
};

export function BabyForm(props: Props) {
  const initial = props.kind === "edit" ? props.baby : null;
  const [name, setName] = useState(initial?.name ?? "");
  const [birthdate, setBirthdate] = useState(initial?.birthdate ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isCreate = props.kind === "create";
  const passwordRequired = isCreate;
  const passwordTouched = password.length > 0 || confirm.length > 0;

  function validate(): string | null {
    if (!name.trim()) return "Le prénom est obligatoire.";
    if (!birthdate) return "La date de naissance est obligatoire.";
    if (passwordRequired || passwordTouched) {
      if (password.length < 4) return "Le mot de passe doit faire au moins 4 caractères.";
      if (password !== confirm) return "Les deux mots de passe ne correspondent pas.";
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
        password,
      });
    } else {
      const patch: BabyEdit = {};
      if (name.trim() !== props.baby.name) patch.name = name.trim();
      if (birthdate !== props.baby.birthdate) patch.birthdate = birthdate;
      const passwordChange = passwordTouched ? { newPassword: password } : null;
      await props.onSubmit(patch, passwordChange);
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

      <label className="flex flex-col gap-1">
        <span className="text-sm text-(--color-ink-soft)">
          {isCreate ? "Mot de passe (min. 4 caractères)" : "Nouveau mot de passe (laisse vide pour ne rien changer)"}
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="rounded-2xl border border-(--color-line) bg-(--color-surface) px-4 py-3 text-base"
        />
      </label>

      {(passwordRequired || passwordTouched) && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-(--color-ink-soft)">Confirme le mot de passe</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {props.submitting ? "Enregistrement…" : isCreate ? "Créer le bébé" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
