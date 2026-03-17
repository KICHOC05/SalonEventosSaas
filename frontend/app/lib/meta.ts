type MetaEntry = { title: string } | { name: string; content: string };

export function buildMeta(
  pagina: string,
  descripcion?: string
): MetaEntry[] {
  const meta: MetaEntry[] = [
    { title: `SpaceKids - ${pagina}` },
  ];

  if (descripcion) {
    meta.push({ name: "description", content: descripcion });
  }

  return meta;
}