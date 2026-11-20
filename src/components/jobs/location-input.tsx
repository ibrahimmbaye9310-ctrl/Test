"use client";

import { useEffect, useId, useRef, useState } from "react";

type Suggestion = { label: string; value: string };

/**
 * Champ « Ville ou code postal » avec suggestions natives (<datalist>) : léger, accessible et utilisable au clavier
 * comme au doigt. Les suggestions viennent de /api/lieux (communes d'Île-de-France).
 */
export function LocationInput({ defaultValue, className, name = "lieu", id }: { defaultValue?: string; className?: string; name?: string; id?: string }) {
  const listId = useId();
  const [items, setItems] = useState<Suggestion[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const controller = useRef<AbortController>(undefined);

  useEffect(() => () => {
    clearTimeout(timer.current);
    controller.current?.abort();
  }, []);

  function onInput(value: string) {
    clearTimeout(timer.current);
    if (value.trim().length < 2) return setItems([]);
    timer.current = setTimeout(async () => {
      controller.current?.abort();
      controller.current = new AbortController();
      try {
        const res = await fetch(`/api/lieux?q=${encodeURIComponent(value)}`, { signal: controller.current.signal });
        if (res.ok) setItems(((await res.json()) as { items: Suggestion[] }).items);
      } catch {
        /* requête annulée ou hors ligne : on garde la saisie libre */
      }
    }, 150);
  }

  return (
    <>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue}
        list={listId}
        placeholder="Ville, code postal"
        autoComplete="off"
        maxLength={80}
        onChange={(e) => onInput(e.target.value)}
        className={className}
      />
      <datalist id={listId}>
        {items.map((s) => (
          <option key={s.label} value={s.value} label={s.label} />
        ))}
      </datalist>
    </>
  );
}
