'use client';

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ── Types ─────────────────────────────────────────────────────
interface FieldDef {
  name: string;
  type: string;
  pk: boolean;
  fk: boolean;
  unique: boolean;
}
interface RelationDef {
  name: string;
  type: string;
  isList: boolean;
  label: string;
}
interface ModelDef {
  name: string;
  fields: FieldDef[];
  relations: RelationDef[];
  [key: string]: any;
}
interface ERDiagramProps {
  models: ModelDef[];
}

// ── Custom Table Node ─────────────────────────────────────────
function TableNode({ data }: NodeProps) {
  const { name, fields, relations } = data as unknown as ModelDef;

  const typeColor: Record<string, string> = {
    Int: "#7c3aed", String: "#0369a1", Boolean: "#b45309",
    DateTime: "#0f766e", Float: "#be123c",
  };

  return (
    <div style={{
      minWidth: 230,
      fontFamily: "'Inter', sans-serif",
      borderRadius: "1rem",
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,91,191,0.12), 0 2px 8px rgba(0,0,0,0.07)",
      border: "1.5px solid rgba(193,198,214,0.4)",
      background: "#fff",
    }}>
      {/* Handles for edges — one on each side of the node */}
      <Handle type="target" position={Position.Left}  id="left"   style={{ background: "#005bbf", width: 10, height: 10, border: "2px solid white" }} />
      <Handle type="source" position={Position.Right} id="right"  style={{ background: "#005bbf", width: 10, height: 10, border: "2px solid white" }} />
      <Handle type="target" position={Position.Top}   id="top"    style={{ background: "#005bbf", width: 10, height: 10, border: "2px solid white" }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: "#005bbf", width: 10, height: 10, border: "2px solid white" }} />

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#005bbf 0%,#1a73e8 100%)",
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
            table_rows
          </span>
          <span style={{ color: "white", fontWeight: 900, fontSize: 13, letterSpacing: "0.04em" }}>
            {name}
          </span>
        </div>
        {relations.length > 0 && (
          <span style={{
            background: "rgba(255,255,255,0.2)", color: "white", fontSize: 9,
            fontWeight: 800, padding: "2px 7px", borderRadius: 99,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {relations.length} rel
          </span>
        )}
      </div>

      {/* Fields */}
      <div style={{ padding: "6px 0" }}>
        {fields.map((f, i) => {
          const rawType = f.type.replace("?", "").replace("[]", "");
          const color = typeColor[rawType] ?? "#414754";
          return (
            <div key={f.name} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "5px 14px",
              background: i % 2 === 0 ? "transparent" : "rgba(0,91,191,0.025)",
              borderBottom: i < fields.length - 1 ? "1px solid rgba(193,198,214,0.12)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: f.pk ? "#fbbf24" : f.fk ? "#60a5fa" : f.unique ? "#34d399" : "#cbd5e1",
                }} />
                <span style={{
                  fontSize: 11, fontWeight: f.pk || f.fk ? 800 : 600,
                  color: f.pk || f.fk ? "#191c1d" : "#414754",
                }}>
                  {f.name}
                </span>
                {f.pk   && <span style={{ fontSize: 8, fontWeight: 900, color: "#d97706", textTransform: "uppercase" }}>PK</span>}
                {f.fk   && <span style={{ fontSize: 8, fontWeight: 900, color: "#2563eb", textTransform: "uppercase" }}>FK</span>}
                {f.unique && !f.pk && <span style={{ fontSize: 8, fontWeight: 900, color: "#059669", textTransform: "uppercase" }}>U</span>}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 800, color, textTransform: "uppercase",
                letterSpacing: "0.06em", fontFamily: "monospace",
              }}>
                {f.type}
              </span>
            </div>
          );
        })}
      </div>

      {/* Relations footer */}
      {relations.length > 0 && (
        <div style={{
          borderTop: "1px solid rgba(0,91,191,0.1)",
          background: "rgba(0,91,191,0.03)",
          padding: "6px 14px",
        }}>
          {relations.map((rel) => (
            <div key={rel.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 11, color: "#005bbf" }}>
                {rel.isList ? "account_tree" : "link"}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#005bbf", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {rel.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { tableNode: TableNode };

// ── Layout ────────────────────────────────────────────────────
function buildGraph(models: ModelDef[]): { nodes: Node[]; edges: Edge[] } {
  const COLS = 3;
  const COL_W = 310;
  const ROW_H = 370;

  const nodes: Node[] = models.map((model, i) => ({
    id: model.name,
    type: "tableNode",
    position: {
      x: (i % COLS) * COL_W + 60,
      y: Math.floor(i / COLS) * ROW_H + 60,
    },
    data: model,
  }));

  const edges: Edge[] = [];
  const added = new Set<string>();

  for (const model of models) {
    for (const rel of model.relations) {
      // key to avoid duplicate edges (A→B and B→A both from their respective sides)
      const key = [model.name, rel.type].sort().join("<->");
      if (added.has(key)) continue;
      added.add(key);

      // 1:N → the "one" side is rel.type, the "many" side is model.name
      const [fromId, toId] = rel.isList
        ? [rel.type, model.name]
        : [model.name, rel.type];

      edges.push({
        id: `${fromId}->${toId}`,
        source: fromId,
        target: toId,
        sourceHandle: "right",
        targetHandle: "left",
        type: "smoothstep",
        animated: true,
        label: rel.isList ? "1 : N" : "N : 1",
        labelStyle: { fontSize: 9, fontWeight: 900, fill: "#005bbf" },
        labelBgStyle: { fill: "white", fillOpacity: 0.95 },
        labelBgPadding: [5, 8] as [number, number],
        labelBgBorderRadius: 6,
        style: { stroke: "#005bbf", strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#005bbf",
          width: 14,
          height: 14,
        },
      });
    }
  }

  return { nodes, edges };
}

// ── Main ──────────────────────────────────────────────────────
export default function ERDiagram({ models }: ERDiagramProps) {
  const { nodes: init_nodes, edges: init_edges } = useMemo(
    () => buildGraph(models), [models]
  );

  const [nodes, , onNodesChange] = useNodesState(init_nodes);
  const [edges, , onEdgesChange] = useEdgesState(init_edges);

  return (
    <div
      style={{ width: "100%", height: "78vh", borderRadius: "1.5rem", overflow: "hidden" }}
      className="border border-[var(--color-outline-variant)]/20 shadow-[0_20px_50px_rgba(0,0,0,0.07)] animate-in slide-in-from-bottom-4 duration-700"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.15}
        maxZoom={2.5}
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#c1c6d6" />
        <Controls style={{
          background: "white",
          border: "1px solid rgba(193,198,214,0.3)",
          borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }} />
        <MiniMap
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(193,198,214,0.3)",
            borderRadius: 12,
          }}
          nodeColor="#005bbf"
          maskColor="rgba(248,250,251,0.7)"
        />

        {/* Legend */}
        <Panel position="top-left">
          <div style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(193,198,214,0.3)",
            borderRadius: 14,
            padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
          }}>
            <p style={{ fontSize: 9, fontWeight: 900, color: "#727785", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              Leyenda
            </p>
            {[
              { color: "#fbbf24", label: "Clave Primaria (PK)" },
              { color: "#60a5fa", label: "Clave Foránea (FK)" },
              { color: "#34d399", label: "Campo Único (U)" },
              { color: "#cbd5e1", label: "Campo regular" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#414754" }}>{label}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, borderTop: "1px solid rgba(193,198,214,0.25)", paddingTop: 8 }}>
              <p style={{ fontSize: 9, fontWeight: 900, color: "#727785", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                Relaciones
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 2, background: "#005bbf", borderRadius: 2 }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#414754" }}>Flecha animada = FK</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Stats */}
        <Panel position="top-right">
          <div style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(193,198,214,0.3)",
            borderRadius: 14,
            padding: "10px 16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
            display: "flex", gap: 20,
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#005bbf", lineHeight: 1 }}>{models.length}</p>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#727785", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Tablas</p>
            </div>
            <div style={{ width: 1, background: "rgba(193,198,214,0.3)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#005bbf", lineHeight: 1 }}>{init_edges.length}</p>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#727785", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Relaciones</p>
            </div>
            <div style={{ width: 1, background: "rgba(193,198,214,0.3)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#005bbf", lineHeight: 1 }}>
                {models.reduce((a, m) => a + m.fields.length, 0)}
              </p>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#727785", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Campos</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
