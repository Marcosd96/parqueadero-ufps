"use client";

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { submitRegistration, submitGuestRegistration } from "./actions";

/* ─── Types ────────────────────────────────────────────────── */
type UserType = "ESTUDIANTE" | "ADMINISTRATIVO" | "DOCENTE" | "";
type FieldState = "idle" | "loading" | "found" | "not-found";

/* ─── Image compression (Canvas API) ──────────────────────────
   Phone cameras produce 8-15 MB JPEGs which exceed the server
   action body limit when two files are uploaded together.
   This compresses images to max 1920px / 82% JPEG quality
   (~300-600 KB) before upload. PDFs pass through unchanged.
   ──────────────────────────────────────────────────────────── */
const MAX_PX = 1920;
const QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 512 * 1024) return file; // skip files < 500 KB

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) {
          height = Math.round((height * MAX_PX) / width);
          width = MAX_PX;
        } else {
          width = Math.round((width * MAX_PX) / height);
          height = MAX_PX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg", lastModified: Date.now() }
          );
          // Only use compressed version if it's actually smaller
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

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
      const rest = { ...prev };
      delete rest.code;
      return rest;
    });

    setCodeState("loading");
    try {
      const res = await fetch(`/api/lookup-student?code=${encodeURIComponent(code.trim())}`);
      if (res.status === 429) {
        setErrors(prev => ({ ...prev, code: "Demasiadas búsquedas. Espera un momento." }));
        setCodeState("idle");
        return;
      }
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

  const [tab, setTab] = useState<"institutional" | "guest">("institutional");
  
  // Guest form state
  const [hostCode, setHostCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestDescription, setGuestDescription] = useState("");
  const [guestPlate, setGuestPlate] = useState("");
  const [hostCarnetFile, setHostCarnetFile] = useState<File | null>(null);
  const [hostCodeState, setHostCodeState] = useState<FieldState>("idle");

  const handleHostCodeBlur = useCallback(async () => {
    if (!hostCode.trim()) return;
    setHostCodeState("loading");
    try {
      const res = await fetch(`/api/lookup-student?code=${encodeURIComponent(hostCode.trim())}`);
      if (res.status === 429) {
        setErrors(prev => ({ ...prev, hostCode: "Demasiadas búsquedas. Espera un momento." }));
        setHostCodeState("idle");
        return;
      }
      const data = await res.json();
      if (data) {
        setHostCodeState("found");
      } else {
        setHostCodeState("not-found");
      }
    } catch {
      setHostCodeState("not-found");
    }
  }, [hostCode]);

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
    setServerError("");

    const currentErrors = validate();
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Compress images before upload (handles large phone camera photos)
      const [compressedCarnet, compressedOwnership] = await Promise.all([
        carnetFile ? compressImage(carnetFile) : Promise.resolve(null),
        ownershipFile ? compressImage(ownershipFile) : Promise.resolve(null),
      ]);

      const fd = new FormData();
      fd.append("userType", userType);
      fd.append("email", email);
      fd.append("institutionalCode", code);
      fd.append("fullName", fullName);
      fd.append("plate", plate);
      fd.append("vehicleBrand", brand);
      fd.append("vehicleModel", model);
      if (compressedCarnet) fd.append("carnetFile", compressedCarnet);
      if (compressedOwnership) fd.append("ownershipFile", compressedOwnership);

      const result = await submitRegistration(fd);
      if (result.success) {
        setSubmitted(true);
      } else {
        setServerError(result.error ?? "Error desconocido.");
      }
    } catch {
      setServerError("No se pudo completar el envío. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const eArr: Record<string, string> = {};
    if (!hostCode.trim()) eArr.hostCode = "El código del anfitrión es obligatorio.";
    if (!guestName.trim()) eArr.guestName = "El nombre del invitado es obligatorio.";
    if (!guestPhone.trim()) eArr.guestPhone = "El teléfono es obligatorio.";
    if (!guestDescription.trim()) eArr.guestDescription = "La descripción es obligatoria.";
    if (!hostCarnetFile) eArr.hostCarnetFile = "Debes subir el carnet del anfitrión.";

    if (Object.keys(eArr).length > 0) {
      setErrors(eArr);
      return;
    }

    setSubmitting(true);
    try {
      // Compress host carnet image before upload
      const compressedCarnet = hostCarnetFile ? await compressImage(hostCarnetFile) : null;

      const fd = new FormData();
      fd.append("hostCode", hostCode);
      fd.append("guestName", guestName);
      fd.append("phone", guestPhone);
      fd.append("description", guestDescription);
      fd.append("plate", guestPlate);
      if (compressedCarnet) fd.append("hostCarnetFile", compressedCarnet);

      const result = await submitGuestRegistration(fd);
      if (result.success) {
        setSubmitted(true);
      } else {
        setServerError(result.error ?? "Error desconocido.");
      }
    } catch {
      setServerError("No se pudo completar el envío. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ────────────────────────────────────── */
  if (submitted) {
    const isGuest = tab === "guest";
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)] p-4 sm:p-6 md:p-8">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-[1.25rem] border border-[var(--color-outline-variant)] p-6 sm:p-8 md:p-10 max-w-[440px] w-full flex flex-col items-center shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center mb-4 sm:mb-5">
            <span className="material-symbols-outlined text-[2.5rem] sm:text-[3rem]" style={{ color: "var(--color-primary)" }}>
              check_circle
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mb-2 text-center font-[var(--font-headline)]">
            ¡Solicitud enviada!
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-on-surface-variant)] font-[var(--font-label)] m-0 text-center leading-relaxed">
            Tu solicitud de acceso al parqueadero está en revisión. Recibirás una respuesta en {isGuest ? "el teléfono proporcionado" : "tu correo"}{" "}
            <strong className="text-[var(--color-primary)] break-all">{isGuest ? guestPhone : email}</strong>.
          </p>
          <div className="mt-5 bg-[var(--color-surface-container-low)] rounded-xl p-4 sm:p-5 flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 text-sm font-[var(--font-label)] text-[var(--color-on-surface)] font-bold">
              <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: "1rem" }}>
                {isGuest ? "account_circle" : "badge"}
              </span>
              <span className="truncate">{isGuest ? `Invitado: ${guestName} (Anfitrión: ${hostCode})` : code}</span>
            </div>
            {(isGuest ? guestPlate : plate) && (
              <div className="flex items-center gap-2 text-sm font-[var(--font-label)] text-[var(--color-on-surface)] font-bold">
                <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: "1rem" }}>directions_car</span>
                <span className="truncate">
                  {isGuest 
                    ? `Vehículo: ${guestPlate}`
                    : `${brand} ${model} (${plate})`
                  }
                </span>
              </div>
            )}
          </div>
          <button
            className="w-full mt-6 bg-[var(--color-primary)] text-white py-3 sm:py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            onClick={() => {
              setSubmitted(false);
              // Clear institutional
              setCode(""); setEmail(""); setFullName(""); setPlate("");
              setBrand(""); setModel("");
              setUserType(""); setCarnetFile(null); setOwnershipFile(null);
              setCodeState("idle");
              // Clear guest
              setHostCode(""); setGuestName(""); setGuestPhone("");
              setGuestDescription(""); setGuestPlate(""); setHostCarnetFile(null);
              setHostCodeState("idle");
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
    <div className="flex flex-col lg:flex-row min-h-screen font-[var(--font-body)] bg-[var(--color-background)]">
      {/* Left panel */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 bg-gradient-to-br from-[#003c8f] via-[#005bbf] to-[#1a73e8] text-white flex flex-col justify-center p-8 lg:p-12 relative overflow-hidden">
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 lg:mb-12">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-2xl">
                local_parking
              </span>
            </div>
            <div>
              <div className="font-black text-lg tracking-tight">UFPS PARKING</div>
              <div className="text-[0.7rem] opacity-70">UFPS — Parqueadero Universitario</div>
            </div>
          </div>

          <div className="flex bg-white/10 p-1 rounded-xl mb-8 gap-1">
            <button
              onClick={() => setTab("institutional")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-none font-bold text-[0.8rem] transition-all cursor-pointer ${
                tab === "institutional" 
                ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]" 
                : "bg-transparent text-white"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>school</span>
              Comunidad UFPS
            </button>
            <button
              onClick={() => setTab("guest")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-none font-bold text-[0.8rem] transition-all cursor-pointer ${
                tab === "guest" 
                ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]" 
                : "bg-transparent text-white"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>group</span>
              Invitados
            </button>
          </div>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-2xl lg:text-3xl font-black leading-tight mb-4 font-[var(--font-headline)] tracking-tight">
              {tab === "institutional" ? "Solicita tu acceso al parqueadero" : "Registro para invitados externos"}
            </h1>
            <p className="text-sm lg:text-base opacity-80 leading-relaxed font-[var(--font-label)]">
              {tab === "institutional" 
                ? "Completa el formulario y adjunta los documentos requeridos. El equipo administrativo revisará tu solicitud y te notificará por correo."
                : "Si eres un invitado auspiciado por un miembro de la universidad, completa estos datos para solicitar tu acceso temporal al campus."}
            </p>
          </div>

          {/* Feature list */}
          <div className="hidden sm:flex flex-col gap-4">
            {[
              { icon: "shield_lock", text: "Verificación institucional" },
              { icon: "upload_file", text: "Carga segura de documentos" },
              { icon: "notifications_active", text: "Notificación por correo @ufps.edu.co" },
              { icon: "manage_search", text: "Autocompletado desde base de datos" },
            ].map((f) => (
              <div key={f.icon} className="flex items-center gap-3 text-sm opacity-90 font-[var(--font-label)]">
                <span className="material-symbols-outlined text-[1.125rem]">
                  {f.icon}
                </span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
 
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-[240px] h-[240px] md:w-[300px] md:h-[300px] rounded-full bg-white/5" />
        <div className="absolute top-20 -right-5 w-[140px] h-[140px] md:w-[180px] md:h-[180px] rounded-full bg-white/5" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 overflow-y-auto flex justify-center items-start p-6 lg:p-12">
        <div className="w-full max-w-[560px]">
          <div className="mb-10">
            <h2 className="text-2xl font-black mb-2 font-[var(--font-headline)] tracking-tight text-[var(--color-on-surface)]">
              {tab === "institutional" ? "Formulario de registro" : "Solicitud para visitantes"}
            </h2>
            <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed font-[var(--font-label)]">
              {tab === "institutional" 
                ? "Ingresa tu código institucional primero — los demás campos se completarán automáticamente."
                : "Ingresa el código institucional de la persona que te invita junto con tus datos de contacto."}
            </p>
          </div>

          {tab === "institutional" ? (
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Section 1 */}
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[var(--color-outline-variant)] mb-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">person</span>
                <span className="text-[0.75rem] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] font-[var(--font-label)]">Datos personales</span>
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
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[var(--color-outline-variant)] mb-4 mt-2">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">directions_car</span>
                <span className="text-[0.75rem] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] font-[var(--font-label)]">Información del vehículo</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1">
                  <FileDropZone
                    id="carnetFile"
                    label="Carnet estudiantil / institucional"
                    icon="badge"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    file={carnetFile}
                    onChange={setCarnetFile}
                  />
                  {errors.carnetFile && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-error)", fontFamily: "var(--font-label)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>error</span>
                      {errors.carnetFile}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <FileDropZone
                    id="ownershipFile"
                    label="Documento de propiedad"
                    icon="assignment"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    file={ownershipFile}
                    onChange={setOwnershipFile}
                  />
                  {errors.ownershipFile && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-error)", fontFamily: "var(--font-label)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>error</span>
                      {errors.ownershipFile}
                    </span>
                  )}
                </div>
              </div>

              {serverError && (
                <div className="bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all ${submitting ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: "1.25rem" }}>sync</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>send</span>
                    Solicitar Acceso
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleGuestSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="flex items-center gap-2 pb-2 border-b-2 border-[var(--color-outline-variant)] mb-4">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">person</span>
                <span className="text-[0.75rem] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] font-[var(--font-label)]">Información del invitado</span>
              </div>

              <Field
                id="hostCode"
                label="Código del anfitrión (Quién te invita)"
                icon="account_circle"
                value={hostCode}
                onChange={(v) => { setHostCode(v); setHostCodeState("idle"); }}
                onBlur={handleHostCodeBlur}
                placeholder="Ej: 1151757 o 0759"
                error={errors.hostCode}
                autoCompleting={hostCodeState === "loading"}
                suffix={
                  hostCodeState === "found" ? (
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#16a34a" }}>check_circle</span>
                  ) : hostCodeState === "not-found" ? (
                    <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--color-error)" }}>cancel</span>
                  ) : null
                }
              />

              <Field
                id="guestName"
                label="Nombre completo del invitado"
                icon="person"
                value={guestName}
                onChange={setGuestName}
                placeholder="Nombres y apellidos de quien ingresa"
                error={errors.guestName}
              />

              <Field
                id="guestPhone"
                label="Número de teléfono"
                icon="phone"
                value={guestPhone}
                onChange={setGuestPhone}
                placeholder="Ej: 310 000 0000"
                error={errors.guestPhone}
              />

              <Field
                id="guestPlate"
                label="Placa del vehículo (Opcional)"
                icon="confirmation_number"
                value={guestPlate}
                onChange={(v) => setGuestPlate(v.toUpperCase())}
                placeholder="Ej: HUF367"
              />

              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-on-surface-variant)", fontFamily: "var(--font-label)" }}>
                  Descripción de la solicitud
                </label>
                <textarea
                  value={guestDescription}
                  onChange={(e) => setGuestDescription(e.target.value)}
                  placeholder="Detalla tu solicitud. Ej: Se solicita el ingreso de vehiculo con placas HUF 367 con pasajeros pepito j y maria g"
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    boxSizing: "border-box",
                    background: "var(--color-surface-container-lowest)",
                    border: `1.5px solid ${errors.guestDescription ? "var(--color-error)" : "var(--color-outline-variant)"}`,
                    borderRadius: "0.625rem",
                    padding: "0.75rem 1rem",
                    fontSize: "0.9375rem",
                    fontFamily: "var(--font-body)",
                    color: "var(--color-on-surface)",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
                {errors.guestDescription && (
                  <span style={{ fontSize: "0.75rem", color: "var(--color-error)", fontFamily: "var(--font-label)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>error</span>
                    {errors.guestDescription}
                  </span>
                )}
              </div>

              <FileDropZone
                id="hostCarnetFile"
                label="Subir Carnet del anfitrión"
                icon="badge"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                file={hostCarnetFile}
                onChange={setHostCarnetFile}
              />
              {errors.hostCarnetFile && (
                <span style={{ fontSize: "0.75rem", color: "var(--color-error)", fontFamily: "var(--font-label)", marginTop: "-0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>error</span>
                  {errors.hostCarnetFile}
                </span>
              )}

              {serverError && (
                <div className="bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all ${submitting ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: "1.25rem" }}>sync</span>
                    Registrando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "1.25rem" }}>send</span>
                    Enviar Solicitud
                  </>
                )}
              </button>
            </form>
          )}
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