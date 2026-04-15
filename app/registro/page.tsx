"use client";

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { submitRegistration } from "./actions";

/* ─── Types ────────────────────────────────────────────────── */
type UserType = "ESTUDIANTE" | "ADMINISTRATIVO" | "DOCENTE" | "";
type FieldState = "idle" | "loading" | "found" | "not-found";

/* ─── Plate validation ─────────────────────────────────────── */
// Support cars (ABC123, AB1234) and motorcycles (MGO18G, FJE62A)
const PLATE_RE = /^[A-Z]{2,3}[0-9]{2,4}[A-Z]?$/;

/* ─── FileDropZone component ───────────────────────────────── */
function FileDropZone({
  id,
  label,
  icon,
  accept,
  file,
  onChange,
}: {
  id: string;
  label: string;
  icon: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-on-surface-variant)",
          fontFamily: "var(--font-label)",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--color-primary)" : file ? "var(--color-primary)" : "var(--color-outline-variant)"}`,
          borderRadius: "0.75rem",
          padding: "1.25rem 1rem",
          cursor: "pointer",
          transition: "all 200ms ease",
          background: dragging
            ? "rgba(0,91,191,0.06)"
            : file
            ? "rgba(0,91,191,0.04)"
            : "var(--color-surface-container-low)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          textAlign: "center",
          outline: "none",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: "2rem",
            color: file ? "var(--color-primary)" : "var(--color-on-surface-variant)",
            opacity: file ? 1 : 0.5,
          }}
        >
          {file ? "check_circle" : icon}
        </span>
        {file ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-primary)",
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {file.name}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-error)",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                close
              </span>
            </button>
          </div>
        ) : (
          <>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-on-surface-variant)",
                fontFamily: "var(--font-label)",
              }}
            >
              Arrastra aquí o{" "}
              <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                selecciona archivo
              </span>
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--color-on-surface-variant)",
                opacity: 0.6,
                fontFamily: "var(--font-label)",
              }}
            >
              PDF o imagen (JPG, PNG)
            </span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.files?.[0] ?? null)
        }
      />
    </div>
  );
}

/* ─── Input Field component ────────────────────────────────── */
function Field({
  id,
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  error,
  readOnly,
  autoCompleting,
  suffix,
  onBlur,
}: {
  id: string;
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  readOnly?: boolean;
  autoCompleting?: boolean;
  suffix?: React.ReactNode;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: hasError
            ? "var(--color-error)"
            : focused
            ? "var(--color-primary)"
            : "var(--color-on-surface-variant)",
          fontFamily: "var(--font-label)",
          transition: "color 150ms",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span
          className="material-symbols-outlined"
          style={{
            position: "absolute",
            left: "0.875rem",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "1.125rem",
            color: hasError
              ? "var(--color-error)"
              : focused
              ? "var(--color-primary)"
              : "var(--color-on-surface-variant)",
            opacity: 0.7,
            transition: "color 150ms",
            pointerEvents: "none",
          }}
        >
          {autoCompleting ? "sync" : icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (onBlur) onBlur();
          }}
          placeholder={placeholder}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: readOnly
              ? "var(--color-surface-container-low)"
              : "var(--color-surface-container-lowest)",
            border: `1.5px solid ${
              hasError
                ? "var(--color-error)"
                : focused
                ? "var(--color-primary)"
                : "var(--color-outline-variant)"
            }`,
            borderRadius: "0.625rem",
            padding: suffix
              ? "0.75rem 3rem 0.75rem 2.5rem"
              : "0.75rem 1rem 0.75rem 2.5rem",
            fontSize: "0.9375rem",
            fontFamily: "var(--font-body)",
            color: readOnly
              ? "var(--color-on-surface-variant)"
              : "var(--color-on-surface)",
            outline: "none",
            transition: "border-color 150ms, box-shadow 150ms",
            boxShadow: focused
              ? `0 0 0 3px ${hasError ? "rgba(186,26,26,0.15)" : "rgba(0,91,191,0.15)"}`
              : "none",
            cursor: readOnly ? "default" : "text",
          }}
        />
        {suffix && (
          <div
            style={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-error)",
            fontFamily: "var(--font-label)",
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>
            error
          </span>
          {error}
        </span>
      )}
      {hint && !error && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-on-surface-variant)",
            fontFamily: "var(--font-label)",
            opacity: 0.7,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function RegistroPage() {
  const [userType, setUserType] = useState<UserType>("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [carnetFile, setCarnetFile] = useState<File | null>(null);
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);

  const [codeState, setCodeState] = useState<FieldState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  /* ── Autocomplete on code blur ─────────────────────────── */
  const handleCodeBlur = useCallback(async () => {
    if (!code.trim()) return;

    // First, validate the prefix for the current user type
    const startsWithZero = code.trim().startsWith("0");
    if (userType === "ESTUDIANTE" && startsWithZero) {
      setErrors(prev => ({ ...prev, code: "Los códigos de estudiantes no deben empezar por '0'." }));
      return;
    }
    if ((userType === "ADMINISTRATIVO" || userType === "DOCENTE") && !startsWithZero) {
      setErrors(prev => ({ ...prev, code: "Los códigos de administrativos y docentes deben empezar por '0'." }));
      return;
    }

    // Clear code error if valid prefix
    setErrors(prev => {
      const { code: _, ...rest } = prev;
      return rest;
    });

    setCodeState("loading");
    try {
      const res = await fetch(`/api/lookup-student?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (data) {
        setFullName(data.fullName ?? "");
        setEmail(data.email ?? "");
        setCodeState("found");
      } else {
        setCodeState("not-found");
      }
    } catch {
      setCodeState("not-found");
    }
  }, [code, userType]);

  /* ── Plate uppercase ───────────────────────────────────── */
  const handlePlateChange = (v: string) => setPlate(v.toUpperCase().replace(/[^A-Z0-9]/g, ""));

  /* ── Validate ──────────────────────────────────────────── */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!userType) e.userType = "Selecciona el tipo de usuario.";

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      e.code = "El código institucional es obligatorio.";
    } else {
      const startsWithZero = trimmedCode.startsWith("0");
      if ((userType === "ADMINISTRATIVO" || userType === "DOCENTE") && !startsWithZero) {
        e.code = "Los códigos de administrativos y docentes deben empezar por '0'.";
      } else if (userType === "ESTUDIANTE" && startsWithZero) {
        e.code = "Los códigos de estudiantes no deben empezar por '0'.";
      }
    }

    if (!fullName.trim()) e.fullName = "El nombre completo es obligatorio.";

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      e.email = "El correo es obligatorio.";
    } else if (!trimmedEmail.toLowerCase().endsWith("@ufps.edu.co")) {
      e.email = "Debe ser un correo @ufps.edu.co.";
    }

    if (!plate.trim()) {
      e.plate = "La placa es obligatoria.";
    } else if (!PLATE_RE.test(plate)) {
      e.plate = "Formato inválido. Ej: ABC123 (carro), MGO18G (moto) o AB1234 (venezolana).";
    }

    if (!brand.trim()) e.brand = "La marca es obligatoria.";
    if (!model.trim()) e.model = "El modelo es obligatorio.";

    if (!carnetFile) e.carnetFile = "Debes subir el carnet.";
    if (!ownershipFile) e.ownershipFile = "Debes subir el documento de propiedad.";

    return e;
  };

  /* ── Submit ────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form...");
    setServerError("");

    const currentErrors = validate();
    if (Object.keys(currentErrors).length > 0) {
      console.log("Validation failed:", currentErrors);
      setErrors(currentErrors);
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("userType", userType);
    fd.append("email", email);
    fd.append("institutionalCode", code);
    fd.append("fullName", fullName);
    fd.append("plate", plate);
    fd.append("vehicleBrand", brand);
    fd.append("vehicleModel", model);
    if (carnetFile) fd.append("carnetFile", carnetFile);
    if (ownershipFile) fd.append("ownershipFile", ownershipFile);

    const result = await submitRegistration(fd);
    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setServerError(result.error ?? "Error desconocido.");
    }
  };

  /* ── Success screen ────────────────────────────────────── */
  if (submitted) {
    return (
      <div style={styles.pageCenter}>
        <div style={styles.successCard}>
          <div style={styles.successIconWrap}>
            <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--color-primary)" }}>
              check_circle
            </span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem", fontFamily: "var(--font-headline)" }}>
            ¡Solicitud enviada!
          </h1>
          <p style={{ color: "var(--color-on-surface-variant)", fontFamily: "var(--font-label)", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
            Tu solicitud de acceso al parqueadero está en revisión. Recibirás una respuesta en tu correo{" "}
            <strong style={{ color: "var(--color-primary)" }}>{email}</strong>.
          </p>
          <div style={styles.successMeta}>
            <div style={styles.successMetaItem}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--color-primary)" }}>badge</span>
              <span>{code}</span>
            </div>
            <div style={styles.successMetaItem}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--color-primary)" }}>directions_car</span>
              <span>{brand} {model} ({plate})</span>
            </div>
          </div>
          <button
            style={{ ...styles.btnPrimary, marginTop: "1.5rem" }}
            onClick={() => {
              setSubmitted(false);
              setCode(""); setEmail(""); setFullName(""); setPlate("");
              setBrand(""); setModel("");
              setUserType(""); setCarnetFile(null); setOwnershipFile(null);
              setCodeState("idle");
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>add</span>
            Registrar otro usuario
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────────────── */
  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          {/* Logo */}
          <div style={styles.logoRow}>
            <div style={styles.logoIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.5rem", color: "#fff" }}>
                local_parking
              </span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>Campus ParkGuard</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "1px" }}>UFPS — Parqueadero Universitario</div>
            </div>
          </div>

          {/* Headline */}
          <div style={styles.leftHeadline}>
            <h1 style={styles.leftH1}>Solicita tu acceso al parqueadero</h1>
            <p style={styles.leftSubtitle}>
              Completa el formulario y adjunta los documentos requeridos. El equipo administrativo revisará tu solicitud y te notificará por correo.
            </p>
          </div>

          {/* Feature list */}
          <div style={styles.featureList}>
            {[
              { icon: "shield_lock", text: "Verificación institucional" },
              { icon: "upload_file", text: "Carga segura de documentos" },
              { icon: "notifications_active", text: "Notificación por correo @ufps.edu.co" },
              { icon: "manage_search", text: "Autocompletado desde base de datos" },
            ].map((f) => (
              <div key={f.icon} style={styles.featureItem}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", opacity: 0.9 }}>
                  {f.icon}
                </span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div style={styles.circle1} />
        <div style={styles.circle2} />
      </div>

      {/* Right panel — form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={styles.formTitle}>Formulario de registro</h2>
            <p style={styles.formSubtitle}>
              Ingresa tu código institucional primero — los demás campos se completarán automáticamente.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Section 1 */}
            <div style={styles.sectionHeader}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>person</span>
              <span style={styles.sectionLabel}>Datos personales</span>
            </div>

            {/* User type */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label
                htmlFor="userType"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: errors.userType ? "var(--color-error)" : "var(--color-on-surface-variant)",
                  fontFamily: "var(--font-label)",
                  letterSpacing: "0.01em",
                }}
              >
                Tipo de usuario
              </label>
              <div style={{ position: "relative" }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "1.125rem",
                    color: "var(--color-on-surface-variant)",
                    opacity: 0.7,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  group
                </span>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "var(--color-surface-container-lowest)",
                    border: `1.5px solid ${errors.userType ? "var(--color-error)" : "var(--color-outline-variant)"}`,
                    borderRadius: "0.625rem",
                    padding: "0.75rem 1rem 0.75rem 2.5rem",
                    fontSize: "0.9375rem",
                    fontFamily: "var(--font-body)",
                    color: userType ? "var(--color-on-surface)" : "var(--color-on-surface-variant)",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="" disabled>Selecciona una opción…</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="DOCENTE">Docente</option>
                </select>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: "absolute",
                    right: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "1rem",
                    color: "var(--color-on-surface-variant)",
                    pointerEvents: "none",
                  }}
                >
                  expand_more
                </span>
              </div>
              {errors.userType && (
                <span style={{ fontSize: "0.75rem", color: "var(--color-error)", fontFamily: "var(--font-label)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>error</span>
                  {errors.userType}
                </span>
              )}
            </div>

            {/* Code */}
            <Field
              id="institutionalCode"
              label="Código institucional (N° de carnet)"
              icon="badge"
              value={code}
              onChange={(v) => {
                setCode(v);
                // Clear state when user types
                if (codeState !== "idle") setCodeState("idle");
              }}
              onBlur={handleCodeBlur}
              placeholder={userType === "ADMINISTRATIVO" || userType === "DOCENTE" ? "Ej: 0759" : "Ej: 1151757"}
              hint={
                userType === "ADMINISTRATIVO" || userType === "DOCENTE"
                  ? "Los códigos administrativos y docentes inician con 0"
                  : userType === "ESTUDIANTE"
                  ? "Ingresa tu código tal como aparece en el carnet estudiantil"
                  : undefined
              }
              error={errors.code}
              autoCompleting={codeState === "loading"}
              suffix={
                codeState === "found" ? (
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#16a34a" }}>check_circle</span>
                ) : codeState === "not-found" ? (
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--color-on-surface-variant)", opacity: 0.5 }}>help</span>
                ) : null
              }
            />
            {/* Blur trigger for autocomplete */}
            <div style={{ marginTop: "-0.75rem" }}>
              <button
                type="button"
                onClick={handleCodeBlur}
                disabled={!code.trim() || codeState === "loading"}
                style={{
                  background: "var(--color-primary-fixed)",
                  color: "var(--color-primary)",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.875rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-label)",
                  cursor: code.trim() ? "pointer" : "not-allowed",
                  opacity: !code.trim() ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  transition: "all 150ms",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "0.9rem" }}>
                  {codeState === "loading" ? "sync" : "search"}
                </span>
                {codeState === "loading" ? "Buscando…" : "Buscar en base de datos"}
              </button>
              {codeState === "not-found" && (
                <p style={{ fontSize: "0.75rem", color: "var(--color-on-surface-variant)", margin: "0.375rem 0 0", fontFamily: "var(--font-label)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>info</span>
                  Código no encontrado en la BD. Puedes continuar llenando el formulario manualmente.
                </p>
              )}
              {codeState === "found" && (
                <p style={{ fontSize: "0.75rem", color: "#16a34a", margin: "0.375rem 0 0", fontFamily: "var(--font-label)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>check_circle</span>
                  Datos autocompletados desde la base de datos.
                </p>
              )}
            </div>

            {/* Full name */}
            <Field
              id="fullName"
              label="Nombre completo"
              icon="person"
              value={fullName}
              onChange={setFullName}
              placeholder="Nombres y apellidos"
              error={errors.fullName}
              readOnly={codeState === "found" && !!fullName}
            />

            {/* Email */}
            <Field
              id="email"
              label="Correo institucional"
              icon="mail"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="usuario@ufps.edu.co"
              hint="Debe ser un correo @ufps.edu.co"
              error={errors.email}
              readOnly={codeState === "found" && !!email}
            />

            {/* Section 2 */}
            <div style={{ ...styles.sectionHeader, marginTop: "0.5rem" }}>
              <span className="material-symbols-outlined" style={styles.sectionIcon}>directions_car</span>
              <span style={styles.sectionLabel}>Información del vehículo</span>
            </div>

            {/* Plate */}
            <Field
              id="plate"
              label="Placa del vehículo"
              icon="confirmation_number"
              value={plate}
              onChange={handlePlateChange}
              placeholder="ABC123 o MGO18G"
              hint="Carro: ABC123 · Moto: MGO18G · Venezolana: AB1234"
              error={errors.plate}
            />

            {/* Brand and Model */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field
                id="brand"
                label="Marca"
                icon="factory"
                value={brand}
                onChange={setBrand}
                placeholder="Ej: Mazda, Yamaha"
                error={errors.brand}
              />
              <Field
                id="model"
                label="Modelo"
                icon="model_training"
                value={model}
                onChange={setModel}
                placeholder="Ej: 3, R6, Spark"
                error={errors.model}
              />
            </div>

            {/* Files */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <FileDropZone
                  id="carnetFile"
                  label="Carnet estudiantil / institucional"
                  icon="badge"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  file={carnetFile}
                  onChange={setCarnetFile}
                />
                {errors.carnetFile && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-error)", fontFamily: "var(--font-label)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>error</span>
                    {errors.carnetFile}
                  </span>
                )}
              </div>
              <div>
                <FileDropZone
                  id="ownershipFile"
                  label="Documento de propiedad del auto"
                  icon="description"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  file={ownershipFile}
                  onChange={setOwnershipFile}
                />
                {errors.ownershipFile && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-error)", fontFamily: "var(--font-label)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>error</span>
                    {errors.ownershipFile}
                  </span>
                )}
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <div style={styles.serverError}>
                <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>error</span>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.btnPrimary,
                marginTop: "0.5rem",
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.125rem", animation: "spin 1s linear infinite" }}>
                    sync
                  </span>
                  Enviando solicitud…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>send</span>
                  Enviar solicitud de acceso
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "var(--font-body)",
    background: "var(--color-background)",
  },
  /* ── Left panel ── */
  leftPanel: {
    width: "420px",
    flexShrink: 0,
    background: "linear-gradient(160deg, #003c8f 0%, #005bbf 55%, #1a73e8 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "3rem 2.5rem",
    position: "relative",
    overflow: "hidden",
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "3rem",
  },
  logoIcon: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "0.625rem",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  leftHeadline: {
    marginBottom: "2.5rem",
  },
  leftH1: {
    fontSize: "1.75rem",
    fontWeight: 900,
    lineHeight: 1.2,
    margin: "0 0 0.875rem",
    fontFamily: "var(--font-headline)",
    letterSpacing: "-0.025em",
  },
  leftSubtitle: {
    fontSize: "0.9rem",
    lineHeight: 1.65,
    opacity: 0.8,
    margin: 0,
    fontFamily: "var(--font-label)",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.875rem",
    fontFamily: "var(--font-label)",
    opacity: 0.9,
  },
  circle1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
    bottom: "-80px",
    right: "-80px",
  },
  circle2: {
    position: "absolute",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    top: "60px",
    right: "20px",
  },
  /* ── Right panel ── */
  rightPanel: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "3rem 2rem",
  },
  formContainer: {
    width: "100%",
    maxWidth: "560px",
  },
  formTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    margin: "0 0 0.375rem",
    fontFamily: "var(--font-headline)",
    color: "var(--color-on-surface)",
    letterSpacing: "-0.02em",
  },
  formSubtitle: {
    fontSize: "0.875rem",
    color: "var(--color-on-surface-variant)",
    margin: 0,
    lineHeight: 1.6,
    fontFamily: "var(--font-label)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    paddingBottom: "0.5rem",
    borderBottom: "1.5px solid var(--color-outline-variant)",
  },
  sectionIcon: {
    fontSize: "1.125rem",
    color: "var(--color-primary)",
  } as React.CSSProperties,
  sectionLabel: {
    fontSize: "0.8125rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--color-on-surface-variant)",
    fontFamily: "var(--font-label)",
  } as React.CSSProperties,
  serverError: {
    background: "var(--color-error-container)",
    color: "var(--color-on-error-container)",
    borderRadius: "0.625rem",
    padding: "0.875rem 1rem",
    fontSize: "0.875rem",
    fontFamily: "var(--font-label)",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontWeight: 600,
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.875rem 1.5rem",
    background: "var(--color-primary)",
    color: "#fff",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "0.9375rem",
    fontWeight: 700,
    fontFamily: "var(--font-label)",
    boxShadow: "0 4px 16px rgba(0,91,191,0.3)",
    transition: "opacity 150ms, transform 150ms",
  },
  /* ── Success card ── */
  pageCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "var(--color-background)",
    padding: "2rem",
  },
  successCard: {
    background: "var(--color-surface-container-lowest)",
    borderRadius: "1.25rem",
    border: "1px solid var(--color-outline-variant)",
    padding: "2.5rem",
    maxWidth: "440px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
  },
  successIconWrap: {
    width: "5rem",
    height: "5rem",
    borderRadius: "50%",
    background: "var(--color-primary-fixed)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1.25rem",
  },
  successMeta: {
    marginTop: "1.25rem",
    background: "var(--color-surface-container-low)",
    borderRadius: "0.75rem",
    padding: "0.875rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    width: "100%",
  },
  successMetaItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    fontFamily: "var(--font-label)",
    color: "var(--color-on-surface)",
    fontWeight: 600,
  },
};
