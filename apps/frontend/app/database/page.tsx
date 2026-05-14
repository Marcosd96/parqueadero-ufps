import prisma, { Prisma } from "@parqueadero/database";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import DatabaseActions from "@/components/DatabaseActions";
import ERDiagram from "@/components/ERDiagram";


export default async function DatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; page?: string; view?: string }>;
}) {
  const session = await getSession();
  
  // Restricted to ADMIN
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const table = resolvedParams.table || "User";
  const view = resolvedParams.view || "data";
  const currentPage = Number(resolvedParams.page) || 1;
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  // Dynamically generate table list from Prisma DMMF
  const dmmfModels = (Prisma as any).dmmf?.datamodel?.models || [];
  
  interface DatabaseTable {
    id: string;
    name: string;
    icon: string;
  }

  const tables: DatabaseTable[] = dmmfModels.map((m: any) => ({
    id: m.name,
    name: m.name,
    icon: m.name === "User" ? "group" : 
          m.name === "Student" ? "school" : 
          m.name === "Vehicle" ? "directions_car" : 
          m.name === "AccessLog" ? "history" : "database"
  }));

  // Parse schema.prisma directly — reliable across all Prisma versions
  const fs = (await import('fs')).default;
  const path = (await import('path')).default;

  const SCALAR_TYPES = new Set([
    'String', 'Int', 'Float', 'Boolean', 'DateTime',
    'Json', 'Bytes', 'BigInt', 'Decimal',
  ]);

  function parsePrismaSchema(text: string) {
    // Collect enum names so we can distinguish them from relation types
    const enumNames = new Set<string>();
    for (const m of text.matchAll(/^enum\s+(\w+)\s*\{/gm)) enumNames.add(m[1]);

    const models: any[] = [];

    for (const modelMatch of text.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^}/gm)) {
      const name = modelMatch[1];
      const body = modelMatch[2];

      // FK scalar fields referenced in @relation(fields: [...])
      const fkSet = new Set<string>();
      for (const rm of body.matchAll(/@relation\([^)]*fields:\s*\[([^\]]+)\]/g)) {
        rm[1].split(',').map((s: string) => s.trim()).forEach((f: string) => fkSet.add(f));
      }

      const fields: any[] = [];
      const relations: any[] = [];

      for (const line of body.split('\n')) {
        const clean = line.replace(/\/\/.*$/, '').trim();
        if (!clean || clean.startsWith('@@')) continue;

        // Match: fieldName  Type[]?  ...modifiers
        const m = clean.match(/^(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/);
        if (!m) continue;

        const [, fname, ftype, isList, optional, rest] = m;

        if (SCALAR_TYPES.has(ftype)) {
          fields.push({
            name: fname,
            type: ftype + (isList ? '[]' : optional ? '?' : ''),
            pk: rest.includes('@id') || clean.includes('@id'),
            unique: (rest.includes('@unique') || clean.includes('@unique')) && !clean.includes('@id'),
            fk: fkSet.has(fname),
          });
        } else if (enumNames.has(ftype)) {
          fields.push({
            name: fname,
            type: ftype + (optional ? '?' : ''),
            pk: false,
            unique: false,
            fk: false,
          });
        } else {
          // It's a relation to another model
          relations.push({
            name: fname,
            type: ftype,
            isList: !!isList,
            label: isList ? `1 : N (${ftype})` : `N : 1 (${ftype})`,
          });
        }
      }

      models.push({ name, fields, relations });
    }
    return models;
  }

  let schemaDefinition: any[] = [];
  try {
    const schemaPath = path.resolve(process.cwd(), '../../packages/database/prisma/schema.prisma');
    const schemaText = fs.readFileSync(schemaPath, 'utf-8');
    schemaDefinition = parsePrismaSchema(schemaText);
  } catch {
    // fallback: use DMMF if file read fails (e.g. production build)
    schemaDefinition = dmmfModels.map((model: any) => {
      const fkFields = new Set(
        model.fields
          .filter((f: any) => f.kind === 'object' && Array.isArray(f.relationFromFields) && f.relationFromFields.length > 0)
          .flatMap((f: any) => f.relationFromFields)
      );
      return {
        name: model.name,
        fields: model.fields
          .filter((f: any) => f.kind === 'scalar' || f.kind === 'enum')
          .map((f: any) => ({
            name: f.name,
            type: f.type + (f.isList ? '[]' : f.isRequired ? '' : '?'),
            pk: !!f.isId,
            unique: !!f.isUnique && !f.isId,
            fk: fkFields.has(f.name),
          })),
        relations: model.fields
          .filter((f: any) => f.kind === 'object')
          .map((f: any) => ({
            name: f.name,
            type: f.type,
            isList: f.isList,
            label: f.isList ? `1 : N (${f.type})` : `N : 1 (${f.type})`,
          })),
      };
    });
  }

  let data: any[] = [];
  let totalCount = 0;

  if (view === "data") {
    try {
        const prismaModel = (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)];
        
        if (prismaModel) {
            const queryOptions: any = {
                skip,
                take: pageSize,
            };

            if (table === "User") {
                queryOptions.select = { id: true, username: true, name: true, email: true, role: true, createdAt: true };
            } else if (table === "AccessLog") {
                queryOptions.orderBy = { timestamp: 'desc' };
            }

            [totalCount, data] = await Promise.all([
                prismaModel.count(),
                prismaModel.findMany(queryOptions)
            ]);
        }
    } catch (error) {
        console.error("Error fetching database data:", error);
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'boolean') return value ? "SÍ" : "NO";
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
                        <span className="material-symbols-outlined text-white">database</span>
                    </div>
                    <h1 className="text-4xl font-black text-[var(--color-on-surface)] tracking-tight">Database Hub</h1>
                </div>
                <p className="text-[var(--color-on-surface-variant)] font-medium text-lg">Administración y arquitectura del sistema.</p>
            </div>

            {/* View Switcher */}
            <div className="flex bg-[var(--color-surface-container-high)] p-1 rounded-2xl border border-[var(--color-outline-variant)]/20 shadow-inner">
                <Link
                    href={`/database?view=data&table=${table}`}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                        view === "data" 
                        ? "bg-white text-[var(--color-primary)] shadow-sm" 
                        : "text-[var(--color-on-surface-variant)] hover:bg-white/50"
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">table_rows</span>
                    Explorar Datos
                </Link>
                <Link
                    href={`/database?view=schema`}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                        view === "schema" 
                        ? "bg-white text-[var(--color-primary)] shadow-sm" 
                        : "text-[var(--color-on-surface-variant)] hover:bg-white/50"
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">schema</span>
                    Modelo Relacional
                </Link>
                <Link
                    href={`/database?view=diagram`}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                        view === "diagram" 
                        ? "bg-white text-[var(--color-primary)] shadow-sm" 
                        : "text-[var(--color-on-surface-variant)] hover:bg-white/50"
                    }`}
                >
                    <span className="material-symbols-outlined text-lg">account_tree</span>
                    Diagrama UML
                </Link>
            </div>
        </div>

        {view === "data" ? (
            <>
                {/* Table Selector */}
                <div className="flex flex-wrap gap-3 mb-10">
                    {tables.map((t) => (
                        <Link
                            key={t.id}
                            href={`/database?view=data&table=${t.id}`}
                            className={`flex items-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-sm border ${
                                table === t.id
                                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[0_12px_24px_rgba(0,91,191,0.3)] scale-[1.02]"
                                    : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-transparent hover:bg-[var(--color-surface-container-highest)] hover:border-[var(--color-outline-variant)]/20 hover:-translate-y-0.5"
                            }`}
                        >
                            <span className="material-symbols-outlined text-xl">{t.icon}</span>
                            {t.name}
                        </Link>
                    ))}
                </div>

                {/* Data Table */}
                <div className="card overflow-hidden bg-white/40 backdrop-blur-xl border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--color-surface-container-lowest)]/60 border-b border-[var(--color-outline-variant)]/15">
                                    {columns.map((col: string) => (
                                        <th key={col} className="px-8 py-6 text-[0.65rem] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-outline-variant)]/10">
                                {data.length > 0 ? (
                                    data.map((row: any, i: number) => (
                                        <tr key={i} className="hover:bg-[var(--color-primary)]/[0.03] transition-colors group">
                                            {columns.map((col: string) => (
                                                <td key={col} className="px-8 py-5">
                                                    <span className="text-[0.825rem] font-bold text-[var(--color-on-surface)] opacity-85 group-hover:opacity-100 transition-opacity">
                                                        {formatValue(row[col])}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length || 1} className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-[var(--color-surface-container-high)] rounded-full flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-4xl text-[var(--color-outline)]">database_off</span>
                                                </div>
                                                <p className="text-[var(--color-on-surface-variant)] text-lg font-bold italic tracking-tight">
                                                    No se encontraron registros en la tabla <span className="text-[var(--color-primary)] not-italic">{table}</span>
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination & Footer */}
                <div className="mt-8 flex flex-col lg:flex-row justify-between items-center px-6 gap-8">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <p className="text-[0.65rem] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest opacity-60">
                                Mostrando {data.length} de {totalCount} registros
                            </p>
                            <p className="text-[0.65rem] font-black text-[var(--color-primary)] uppercase tracking-widest mt-1">
                                Página {currentPage} de {totalPages || 1}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/database?view=data&table=${table}&page=${currentPage - 1}`}
                            className={`pagination-btn ${currentPage <= 1 ? "pointer-events-none opacity-30" : ""}`}
                        >
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                        </Link>
                        
                        <div className="flex items-center gap-1 mx-2">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 3 + i + 1;
                                }
                                if (pageNum > totalPages) return null;

                                return (
                                    <Link
                                        key={pageNum}
                                        href={`/database?view=data&table=${table}&page=${pageNum}`}
                                        className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
                                    >
                                        {pageNum}
                                    </Link>
                                );
                            })}
                        </div>

                        <Link
                            href={`/database?view=data&table=${table}&page=${currentPage + 1}`}
                            className={`pagination-btn ${currentPage >= totalPages ? "pointer-events-none opacity-30" : ""}`}
                        >
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                        </Link>
                    </div>

                    <DatabaseActions data={data} tableName={table} />
                </div>
            </>
        ) : view === "schema" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
                {schemaDefinition.map((model: any) => (
                    <div key={model.name} className="card bg-white border-[var(--color-outline-variant)]/20 shadow-xl rounded-[2rem] overflow-hidden flex flex-col group hover:border-[var(--color-primary)]/30 transition-all duration-500 hover:-translate-y-1">
                        <div className="px-8 py-5 bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)]/10 flex justify-between items-center">
                            <h3 className="text-xl font-black text-[var(--color-on-surface)] tracking-tight">{model.name}</h3>
                            <span className="px-2.5 py-1 bg-white rounded-lg text-[0.6rem] font-black text-[var(--color-on-surface-variant)] uppercase tracking-wider shadow-sm">Table</span>
                        </div>
                        <div className="p-6 flex flex-col gap-3">
                            {model.fields.map((field: any) => (
                                <div key={field.name} className="flex items-center justify-between group/field">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${field.pk ? "bg-amber-400" : field.fk ? "bg-blue-400" : "bg-slate-200"}`} title={field.pk ? "Primary Key" : field.fk ? "Foreign Key" : "Field"} />
                                        <span className={`text-sm font-bold ${field.pk || field.fk ? "text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)]"}`}>{field.name}</span>
                                        {field.pk && <span className="text-[0.6rem] font-black text-amber-500 uppercase">PK</span>}
                                        {field.fk && <span className="text-[0.6rem] font-black text-blue-500 uppercase">FK</span>}
                                        {field.unique && <span className="text-[0.6rem] font-black text-emerald-500 uppercase">U</span>}
                                    </div>
                                    <span className="text-[0.65rem] font-black text-[var(--color-outline)] uppercase tracking-widest">{field.type}</span>
                                </div>
                            ))}
                        </div>
                        {model.relations.length > 0 && (
                            <div className="mt-auto px-8 py-5 bg-blue-50/30 border-t border-[var(--color-outline-variant)]/10 flex flex-col gap-3">
                                {model.relations.map((rel: any) => (
                                    <div key={rel.name} className="flex items-center justify-between">
                                        <p className="text-[0.6rem] font-black text-[var(--color-primary)] uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">
                                                {rel.isList ? "account_tree" : "link"}
                                            </span>
                                            {rel.label}
                                        </p>
                                        <span className="text-[0.55rem] font-black px-1.5 py-0.5 bg-white border border-[var(--color-primary)]/20 rounded text-[var(--color-primary)]">
                                            {rel.isList ? "1:N" : "N:1"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ) : view === "diagram" ? (
            <ERDiagram models={schemaDefinition} />
        ) : null}
    </div>
  );
}