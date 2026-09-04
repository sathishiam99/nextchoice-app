import { useState, useEffect, useCallback, useRef } from "react";
import {
  Home as HomeIcon,
  Clock,
  BarChart3,
  Settings,
  ArrowLeft,
  Flame,
  Brain,
  Loader2,
  WifiOff,
  Check,
  Pencil,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  ListChecks,
  Download,
  Upload,
  TrendingUp,
  ShieldCheck,
  Star,
  PieChart as PieChartIcon,
  Leaf,
  Compass,
  Atom,
  Fingerprint,
  Smartphone,
  Gamepad2,
  ShoppingBag,
  UtensilsCrossed,
  Footprints,
  EyeOff,
  Tv,
  MoreHorizontal,
  CalendarDays,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LabelList,
} from "recharts";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600;700&display=swap');`;

const LIGHT_PALETTE = {
  bg: "#F6F5F1",
  card: "#FFFFFF",
  border: "#E4E1D8",
  ink: "#262521",
  inkSoft: "#6B6862",
  inkFaint: "#9A968D",
  pause: "#C1633B",
  pauseSoft: "#F3E3D9",
  reflect: "#4B6358",
  reflectSoft: "#E3E9E5",
  danger: "#B3492E",
  neutral: "#B7AFA0",
  neutralSoft: "#EFEBE0",
  sage: "#8FA48F",
  sageSoft: "#E7EDE4",
  gold: "#C69A4A",
  goldSoft: "#F1E6CC",
};

const DARK_PALETTE = {
  bg: "#18191B",
  card: "#232426",
  border: "#35373A",
  ink: "#F2F1EE",
  inkSoft: "#B7B3AB",
  inkFaint: "#87837B",
  pause: "#DD8657",
  pauseSoft: "rgba(221,134,87,0.2)",
  reflect: "#83A392",
  reflectSoft: "rgba(131,163,146,0.2)",
  danger: "#E0836A",
  neutral: "#75716A",
  neutralSoft: "rgba(117,113,106,0.25)",
  sage: "#8DAE93",
  sageSoft: "rgba(141,174,147,0.2)",
  gold: "#D9B36A",
  goldSoft: "rgba(217,179,106,0.2)",
};

// Mutated in place (not reassigned) so every component reading COLORS.x at
// render time picks up the active theme without prop drilling or context.
const COLORS = { ...LIGHT_PALETTE };

const SHORT_DECISION_LABELS = {
  autopilot: "Autopilot",
  thought_through: "Thought it through",
  gut: "Gut feel",
};

const TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "history", label: "History", icon: Clock },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

const DEFAULT_ACTIONS = [
  { id: "a1", name: "Take 3 deep breaths", active: true, favorite: true, sortOrder: 0, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
  { id: "a2", name: "Go for a walk", active: true, favorite: true, sortOrder: 1, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
  { id: "a3", name: "Call a friend", active: true, favorite: false, sortOrder: 2, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
  { id: "a4", name: "Leave the room", active: true, favorite: false, sortOrder: 3, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
  { id: "a5", name: "Read a book", active: true, favorite: false, sortOrder: 4, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
  { id: "a6", name: "Switch off phone", active: true, favorite: false, sortOrder: 5, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
  { id: "a7", name: "Sit with family", active: true, favorite: false, sortOrder: 6, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
  { id: "a8", name: "Start another task", active: true, favorite: false, sortOrder: 7, applicableUrgeTypes: [], usageCount: 0, successCount: 0 },
];

const DEFAULT_CHOICE_PRESETS = [
  { id: "p1", text: "Skipped a treat", sortOrder: 0, usageCount: 0 },
  { id: "p2", text: "Said no to buying something", sortOrder: 1, usageCount: 0 },
  { id: "p3", text: "Started the task I was avoiding", sortOrder: 2, usageCount: 0 },
  { id: "p4", text: "Went to bed on time", sortOrder: 3, usageCount: 0 },
  { id: "p5", text: "Reached out to a friend", sortOrder: 4, usageCount: 0 },
];

const URGE_TYPES = [
  "Porn / sexual content",
  "YouTube / scrolling",
  "Entertainment",
  "Spending",
  "Food",
  "Gaming",
  "Avoiding something",
  "Custom",
];

// Editable urge types (everything except the fixed "Custom" option) as persisted records.
const DEFAULT_URGE_TYPES = URGE_TYPES.filter((t) => t !== "Custom").map((name, i) => ({
  id: `u${i + 1}`,
  name,
  sortOrder: i,
}));

const URGE_RESULTS = ["The urge went away", "The urge got weaker", "I acted on the urge", "Not sure"];

const DECISION_MODES = [
  { id: "autopilot", label: "Without thinking about it" },
  { id: "thought_through", label: "After thinking it through" },
  { id: "gut", label: "It just felt right" },
];

const OUTCOMES = [
  { id: "helpful", label: "It helped" },
  { id: "unhelpful", label: "It didn't help" },
  { id: "too_early", label: "Too soon to tell" },
];

const CATEGORIES = ["Digital habits", "Spending", "Food", "Work", "Relationships", "Other"];

const STORAGE_KEY = "nextchoice-data";
const DEFAULT_SETTINGS = { theme: "system" };
const DEFAULT_DATA = {
  urges: [],
  choices: [],
  actions: DEFAULT_ACTIONS,
  choicePresets: DEFAULT_CHOICE_PRESETS,
  urgeTypes: DEFAULT_URGE_TYPES,
  settings: DEFAULT_SETTINGS,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function outcomeDisplayLabel(outcome) {
  const found = OUTCOMES.find((o) => o.id === outcome);
  return found ? found.label : outcome;
}

function decisionModeLabel(mode) {
  const found = DECISION_MODES.find((m) => m.id === mode);
  return found ? found.label : null;
}

function formatWhen(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function formatDuration(seconds) {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function useAppData() {
  const [data, setDataState] = useState(DEFAULT_DATA);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined" || !window.storage) {
        if (!cancelled) {
          setDataState(DEFAULT_DATA);
          setStatus("unavailable");
        }
        return;
      }
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (cancelled) return;
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          setDataState({
            urges: Array.isArray(parsed.urges) ? parsed.urges : [],
            choices: Array.isArray(parsed.choices) ? parsed.choices : [],
            actions: Array.isArray(parsed.actions) && parsed.actions.length ? parsed.actions : DEFAULT_ACTIONS,
            choicePresets:
              Array.isArray(parsed.choicePresets) && parsed.choicePresets.length
                ? parsed.choicePresets
                : DEFAULT_CHOICE_PRESETS,
            urgeTypes:
              Array.isArray(parsed.urgeTypes) && parsed.urgeTypes.length ? parsed.urgeTypes : DEFAULT_URGE_TYPES,
            settings: parsed.settings && typeof parsed.settings === "object" ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS,
          });
        } else {
          setDataState(DEFAULT_DATA);
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify(DEFAULT_DATA), false);
          if (!cancelled) {
            setDataState(DEFAULT_DATA);
            setStatus("ready");
          }
        } catch (e2) {
          console.error("NextChoice: storage unavailable, using in-memory data for this session.", e2);
          if (!cancelled) {
            setDataState(DEFAULT_DATA);
            setStatus("unavailable");
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next) => {
    setDataState(next);
    if (typeof window === "undefined" || !window.storage) return;
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
    } catch (e) {
      console.error("NextChoice: save failed, this change may not persist.", e);
    }
  }, []);

  return [data, persist, status];
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
      <p className="text-sm" style={{ color: COLORS.inkFaint }}>
        {label}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 size={20} color={COLORS.inkFaint} className="animate-spin" />
    </div>
  );
}

function UnavailableBanner() {
  return (
    <div
      className="mx-5 mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
      style={{ backgroundColor: "#F1ECDF", border: `1px solid ${COLORS.border}` }}
    >
      <WifiOff size={14} color={COLORS.inkSoft} />
      <p className="text-xs" style={{ color: COLORS.inkSoft }}>
        Saving isn't available right now — entries will disappear if you close this.
      </p>
    </div>
  );
}

function ScreenHeader({ onBack, right }) {
  return (
    <div className="flex items-center justify-between px-5 pt-6 pb-2">
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
        aria-label="Go back"
      >
        <ArrowLeft size={18} color={COLORS.ink} />
      </button>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

function IconButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      {children}
    </button>
  );
}

function ConfirmBar({ message, confirmLabel, onCancel, onConfirm, tone = COLORS.danger }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: tone + "14", border: `1px solid ${tone}33` }}>
      <p className="flex-1 text-xs font-medium" style={{ color: tone }}>
        {message}
      </p>
      <button onClick={onCancel} className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ color: COLORS.inkSoft }}>
        Cancel
      </button>
      <button onClick={onConfirm} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: tone }}>
        {confirmLabel}
      </button>
    </div>
  );
}

function DeleteConfirmBar({ onCancel, onConfirm }) {
  return <ConfirmBar message="Delete this entry?" confirmLabel="Delete" onCancel={onCancel} onConfirm={onConfirm} />;
}

// ---------------- PAUSE FLOW ----------------

function PauseFlow({ actions, urgeTypes, onCancel, onComplete, onEditUrgeTypes }) {
  const [step, setStep] = useState("urge");
  const [urgeType, setUrgeType] = useState(null);
  const [customText, setCustomText] = useState("");
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(null);
  const tickRef = useRef(null);

  useEffect(() => {
    if (step === "doing") {
      setNow(Date.now());
      tickRef.current = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(tickRef.current);
    }
    return undefined;
  }, [step]);

  const urgeTypeNames = [...urgeTypes].sort((a, b) => a.sortOrder - b.sortOrder).map((t) => t.name).concat("Custom");

  const activeSorted = [...actions].filter((a) => a.active);
  const sortedByPreference = [...activeSorted].sort((a, b) =>
    b.favorite === a.favorite ? b.usageCount - a.usageCount : b.favorite ? 1 : -1
  );
  const suggested = sortedByPreference.slice(0, 4);
  const suggestedIds = new Set(suggested.map((a) => a.id));
  const rest = [...activeSorted].filter((a) => !suggestedIds.has(a.id)).sort((a, b) => a.sortOrder - b.sortOrder);

  const pickUrge = (type) => {
    setUrgeType(type);
    if (type !== "Custom") {
      setStartedAt(Date.now());
      setStep("action");
    }
  };

  const confirmCustom = () => {
    if (!customText.trim()) return;
    setStartedAt(Date.now());
    setStep("action");
  };

  const pickAction = (action) => {
    setSelectedAction(action);
    setStep("doing");
  };

  const finishDoing = () => setStep("outcome");

  const pickOutcome = (result) => {
    const endedAt = Date.now();
    onComplete({
      id: uid(),
      urgeType: urgeType === "Custom" ? customText.trim() : urgeType,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      duration: Math.round((endedAt - startedAt) / 1000),
      selectedActionId: selectedAction?.id ?? null,
      result,
      helpfulAction: selectedAction?.name ?? null,
      notes: "",
    });
  };

  const elapsed = now && startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(1, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (step === "urge") {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader onBack={onCancel} />
        <div className="flex flex-1 flex-col px-5 pt-2">
          <h2 className="mb-1 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
            What's going on?
          </h2>
          <div className="mb-5 flex items-start justify-between gap-3">
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              Pick what you're feeling drawn to right now.
            </p>
            <button
              onClick={onEditUrgeTypes}
              className="flex-shrink-0 pt-0.5 text-sm font-medium"
              style={{ color: COLORS.pause }}
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pb-4">
            {urgeTypeNames.map((type) => (
              <button
                key={type}
                onClick={() => pickUrge(type)}
                className="rounded-xl px-4 py-4 text-left text-sm font-medium transition-transform active:scale-[0.97]"
                style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                {type}
              </button>
            ))}
          </div>
          {urgeType === "Custom" && (
            <div className="mt-2 flex flex-col gap-2 pb-4">
              <input
                autoFocus
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="What's the urge?"
                className="rounded-xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              />
              <button
                onClick={confirmCustom}
                disabled={!customText.trim()}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity"
                style={{ backgroundColor: COLORS.pause, opacity: customText.trim() ? 1 : 0.5 }}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "action") {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader onBack={() => setStep("urge")} />
        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-2">
          <h2 className="mb-1 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
            Try instead
          </h2>
          <p className="mb-5 text-sm" style={{ color: COLORS.inkSoft }}>
            Pick one thing to do right now.
          </p>
          <div className="flex flex-col gap-2 pb-4">
            {suggested.map((action) => (
              <button
                key={action.id}
                onClick={() => pickAction(action)}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-transform active:scale-[0.98]"
                style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                {action.name}
                {action.favorite && <span style={{ color: COLORS.pause }}>♥</span>}
              </button>
            ))}
            {!showMoreActions && rest.length > 0 && (
              <button
                onClick={() => setShowMoreActions(true)}
                className="mt-1 rounded-xl px-4 py-3 text-center text-sm"
                style={{ color: COLORS.inkSoft }}
              >
                More options
              </button>
            )}
            {showMoreActions &&
              rest.map((action) => (
                <button
                  key={action.id}
                  onClick={() => pickAction(action)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                >
                  {action.name}
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "doing") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.pauseSoft }}>
            <Flame size={26} color={COLORS.pause} />
          </div>
          <h2 className="text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
            {selectedAction?.name}
          </h2>
          <p className="text-sm" style={{ color: COLORS.inkSoft, maxWidth: "24ch" }}>
            Go do it now. Come back when you're done, however long it takes.
          </p>
          <p className="text-xs" style={{ color: COLORS.inkFaint }}>
            {mm}:{ss} elapsed
          </p>
          <button
            onClick={finishDoing}
            className="mt-4 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
            style={{ backgroundColor: COLORS.pause }}
          >
            I'm back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <h2 className="text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          How did it go?
        </h2>
        <div className="flex w-full flex-col gap-2">
          {URGE_RESULTS.map((r) => (
            <button
              key={r}
              onClick={() => pickOutcome(r)}
              className="rounded-xl px-4 py-3.5 text-sm font-medium transition-transform active:scale-[0.98]"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- QUICK CHOICE PRESET MANAGEMENT (used inside Reflect) ----------------

function PresetRow({ preset, index, count, onEdit, onDelete, onMove }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [text, setText] = useState(preset.text);

  const save = () => {
    if (text.trim()) onEdit(preset.id, text.trim());
    setEditing(false);
  };

  if (confirmingDelete) {
    return (
      <div className="rounded-xl px-3 py-2" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <DeleteConfirmBar onCancel={() => setConfirmingDelete(false)} onConfirm={() => onDelete(preset.id)} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex flex-col">
        <button onClick={() => onMove(preset.id, -1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.25 : 1 }}>
          <ChevronUp size={14} color={COLORS.inkSoft} />
        </button>
        <button onClick={() => onMove(preset.id, 1)} disabled={index === count - 1} style={{ opacity: index === count - 1 ? 0.25 : 1 }}>
          <ChevronDown size={14} color={COLORS.inkSoft} />
        </button>
      </div>

      <div className="flex-1">
        {editing ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg px-2 py-1 text-sm outline-none"
            style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
          />
        ) : (
          <p className="text-sm font-medium" style={{ color: COLORS.ink }}>
            {preset.text}
          </p>
        )}
      </div>

      {editing ? (
        <>
          <button onClick={save} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.reflect }}>
            <Check size={13} color="#FFFFFF" />
          </button>
          <button onClick={() => setEditing(false)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.bg }}>
            <X size={13} color={COLORS.inkSoft} />
          </button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="px-1">
            <Pencil size={14} color={COLORS.inkSoft} />
          </button>
          <button onClick={() => setConfirmingDelete(true)} className="px-1">
            <Trash2 size={14} color={COLORS.danger} />
          </button>
        </>
      )}
    </div>
  );
}

function ManagePresetsScreen({ presets, onBack, onAdd, onEdit, onDelete, onMove }) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const sorted = [...presets].sort((a, b) => a.sortOrder - b.sortOrder);

  const submitAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText("");
    setAdding(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader onBack={onBack} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-2 pb-4">
        <h2 className="mb-1 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          Quick choices
        </h2>
        <p className="mb-5 text-sm" style={{ color: COLORS.inkSoft }}>
          These show as tap-to-fill options when logging a choice.
        </p>

        <div className="flex flex-col gap-2">
          {sorted.map((preset, i) => (
            <PresetRow key={preset.id} preset={preset} index={i} count={sorted.length} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
          ))}
        </div>

        {adding ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <input
              autoFocus
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="New quick choice"
              className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
              style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
            <button onClick={submitAdd} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.reflect }}>
              <Check size={13} color="#FFFFFF" />
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewText("");
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.bg }}
            >
              <X size={13} color={COLORS.inkSoft} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.inkSoft }}
          >
            <Plus size={15} />
            Add quick choice
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- REFLECT FLOW ----------------

function ReflectFlow({ presets, onCancel, onComplete, onAddPreset, onEditPreset, onDeletePreset, onMovePreset, onUsePreset }) {
  const [step, setStep] = useState("what");
  const [text, setText] = useState("");
  const [category, setCategory] = useState(null);
  const [decisionMode, setDecisionMode] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const [notes, setNotes] = useState("");

  const goToHow = () => {
    if (!text.trim()) return;
    setStep("how");
  };

  const pickDecisionMode = (mode) => {
    setDecisionMode(mode);
    setStep("outcome");
  };

  const pickOutcome = (outcome) => {
    onComplete({
      id: uid(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
      category,
      decisionMode,
      outcome,
      notes: notes.trim(),
      relatedUrgeId: null,
    });
  };

  const pickPreset = (preset) => {
    setText(preset.text);
    onUsePreset(preset.id);
  };

  if (step === "managePresets") {
    return (
      <ManagePresetsScreen
        presets={presets}
        onBack={() => setStep("what")}
        onAdd={onAddPreset}
        onEdit={onEditPreset}
        onDelete={onDeletePreset}
        onMove={onMovePreset}
      />
    );
  }

  if (step === "what") {
    const sortedPresets = [...presets].sort((a, b) => a.sortOrder - b.sortOrder);
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader onBack={onCancel} />
        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-2">
          <h2 className="mb-1 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
            What did you choose?
          </h2>
          <p className="mb-4 text-sm" style={{ color: COLORS.inkSoft }}>
            A few words is enough.
          </p>
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Skipped dessert"
            className="mb-4 rounded-xl px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
          />

          {sortedPresets.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs" style={{ color: COLORS.inkFaint }}>
                  Quick choices
                </p>
                <button onClick={() => setStep("managePresets")} className="text-xs font-medium" style={{ color: COLORS.reflect }}>
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedPresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickPreset(p)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-transform active:scale-95"
                    style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
            Category (optional)
          </p>
          <div className="mb-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(active ? null : c)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-transform active:scale-95"
                  style={{
                    backgroundColor: active ? COLORS.reflect : COLORS.card,
                    border: `1px solid ${active ? COLORS.reflect : COLORS.border}`,
                    color: active ? "#FFFFFF" : COLORS.inkSoft,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <button
            onClick={goToHow}
            disabled={!text.trim()}
            className="mb-4 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity"
            style={{ backgroundColor: COLORS.reflect, opacity: text.trim() ? 1 : 0.5 }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === "how") {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader onBack={() => setStep("what")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <h2 className="text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
            How did you choose?
          </h2>
          <div className="flex w-full flex-col gap-2">
            {DECISION_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => pickDecisionMode(m.id)}
                className="rounded-xl px-4 py-3.5 text-sm font-medium transition-transform active:scale-[0.98]"
                style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader onBack={() => setStep("how")} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <h2 className="text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          What happened?
        </h2>
        {!showNote ? (
          <button onClick={() => setShowNote(true)} className="text-xs" style={{ color: COLORS.inkFaint }}>
            + Add a note
          </button>
        ) : (
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering..."
            rows={2}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
          />
        )}
        <div className="flex w-full flex-col gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.id}
              onClick={() => pickOutcome(o.id)}
              className="rounded-xl px-4 py-3.5 text-sm font-medium transition-transform active:scale-[0.98]"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- DETAIL / EDIT / DELETE ----------------

function UrgeDetailScreen({ urge, onBack, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [urgeType, setUrgeType] = useState(urge.urgeType);
  const [result, setResult] = useState(urge.result);
  const [notes, setNotes] = useState(urge.notes || "");

  const save = () => {
    onSave({ ...urge, urgeType: urgeType.trim() || urge.urgeType, result, notes: notes.trim() });
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        onBack={onBack}
        right={
          editing ? (
            <button
              onClick={save}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: COLORS.pause }}
            >
              Save
            </button>
          ) : (
            <>
              <IconButton onClick={() => setEditing(true)}>
                <Pencil size={15} color={COLORS.inkSoft} />
              </IconButton>
              <IconButton onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={15} color={COLORS.danger} />
              </IconButton>
            </>
          )
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-2 pb-4">
        {confirmingDelete && (
          <DeleteConfirmBar onCancel={() => setConfirmingDelete(false)} onConfirm={() => onDelete(urge.id)} />
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.pauseSoft }}>
            <Flame size={18} color={COLORS.pause} />
          </div>
          {editing ? (
            <input
              value={urgeType}
              onChange={(e) => setUrgeType(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-base font-medium outline-none"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          ) : (
            <h2 className="text-lg font-semibold" style={{ color: COLORS.ink }}>
              {urge.urgeType}
            </h2>
          )}
        </div>

        <p className="text-xs" style={{ color: COLORS.inkFaint }}>
          {formatWhen(urge.startedAt)}
          {urge.duration != null && ` · lasted ${formatDuration(urge.duration)}`}
        </p>

        {urge.helpfulAction && (
          <div>
            <p className="mb-1 text-xs" style={{ color: COLORS.inkFaint }}>
              Tried instead
            </p>
            <p className="text-sm" style={{ color: COLORS.ink }}>
              {urge.helpfulAction}
            </p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
            How it went
          </p>
          {editing ? (
            <div className="flex flex-col gap-2">
              {URGE_RESULTS.map((r) => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className="rounded-xl px-4 py-2.5 text-left text-sm font-medium"
                  style={{
                    backgroundColor: result === r ? COLORS.pause : COLORS.card,
                    border: `1px solid ${result === r ? COLORS.pause : COLORS.border}`,
                    color: result === r ? "#FFFFFF" : COLORS.ink,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: COLORS.ink }}>
              {urge.result}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
            Notes
          </p>
          {editing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Nothing added"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          ) : (
            <p className="text-sm" style={{ color: urge.notes ? COLORS.ink : COLORS.inkFaint }}>
              {urge.notes || "Nothing added"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChoiceDetailScreen({ choice, onBack, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [text, setText] = useState(choice.text);
  const [category, setCategory] = useState(choice.category);
  const [decisionMode, setDecisionMode] = useState(choice.decisionMode);
  const [outcome, setOutcome] = useState(choice.outcome);
  const [notes, setNotes] = useState(choice.notes || "");

  const save = () => {
    onSave({ ...choice, text: text.trim() || choice.text, category, decisionMode, outcome, notes: notes.trim() });
    setEditing(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        onBack={onBack}
        right={
          editing ? (
            <button
              onClick={save}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: COLORS.reflect }}
            >
              Save
            </button>
          ) : (
            <>
              <IconButton onClick={() => setEditing(true)}>
                <Pencil size={15} color={COLORS.inkSoft} />
              </IconButton>
              <IconButton onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={15} color={COLORS.danger} />
              </IconButton>
            </>
          )
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-2 pb-4">
        {confirmingDelete && (
          <DeleteConfirmBar onCancel={() => setConfirmingDelete(false)} onConfirm={() => onDelete(choice.id)} />
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.reflectSoft }}>
            <Brain size={18} color={COLORS.reflect} />
          </div>
          {editing ? (
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-xl px-3 py-2 text-base font-medium outline-none"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          ) : (
            <h2 className="text-lg font-semibold" style={{ color: COLORS.ink }}>
              {choice.text}
            </h2>
          )}
        </div>

        <p className="text-xs" style={{ color: COLORS.inkFaint }}>
          {formatWhen(choice.createdAt)}
        </p>

        <div>
          <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
            Category
          </p>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(active ? null : c)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: active ? COLORS.reflect : COLORS.card,
                      border: `1px solid ${active ? COLORS.reflect : COLORS.border}`,
                      color: active ? "#FFFFFF" : COLORS.inkSoft,
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: choice.category ? COLORS.ink : COLORS.inkFaint }}>
              {choice.category || "None"}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
            How you chose
          </p>
          {editing ? (
            <div className="flex flex-col gap-2">
              {DECISION_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDecisionMode(m.id)}
                  className="rounded-xl px-4 py-2.5 text-left text-sm font-medium"
                  style={{
                    backgroundColor: decisionMode === m.id ? COLORS.reflect : COLORS.card,
                    border: `1px solid ${decisionMode === m.id ? COLORS.reflect : COLORS.border}`,
                    color: decisionMode === m.id ? "#FFFFFF" : COLORS.ink,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: choice.decisionMode ? COLORS.ink : COLORS.inkFaint }}>
              {decisionModeLabel(choice.decisionMode) || "Not set"}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
            What happened
          </p>
          {editing ? (
            <div className="flex flex-col gap-2">
              {OUTCOMES.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setOutcome(o.id)}
                  className="rounded-xl px-4 py-2.5 text-left text-sm font-medium"
                  style={{
                    backgroundColor: outcome === o.id ? COLORS.reflect : COLORS.card,
                    border: `1px solid ${outcome === o.id ? COLORS.reflect : COLORS.border}`,
                    color: outcome === o.id ? "#FFFFFF" : COLORS.ink,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: COLORS.ink }}>
              {outcomeDisplayLabel(choice.outcome)}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
            Notes
          </p>
          {editing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Nothing added"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
          ) : (
            <p className="text-sm" style={{ color: choice.notes ? COLORS.ink : COLORS.inkFaint }}>
              {choice.notes || "Nothing added"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- MANAGE TRY INSTEAD ACTIONS ----------------

function ActionRow({ action, index, count, onEdit, onDelete, onToggleFavorite, onMove }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(action.name);

  const save = () => {
    if (name.trim()) onEdit(action.id, name.trim());
    setEditing(false);
  };

  if (confirmingDelete) {
    return (
      <div className="rounded-xl px-3 py-2" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <DeleteConfirmBar onCancel={() => setConfirmingDelete(false)} onConfirm={() => onDelete(action.id)} />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex flex-col">
        <button onClick={() => onMove(action.id, -1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.25 : 1 }}>
          <ChevronUp size={14} color={COLORS.inkSoft} />
        </button>
        <button onClick={() => onMove(action.id, 1)} disabled={index === count - 1} style={{ opacity: index === count - 1 ? 0.25 : 1 }}>
          <ChevronDown size={14} color={COLORS.inkSoft} />
        </button>
      </div>

      <div className="flex-1">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg px-2 py-1 text-sm outline-none"
            style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
          />
        ) : (
          <>
            <p className="text-sm font-medium" style={{ color: COLORS.ink }}>
              {action.name}
            </p>
            {action.usageCount > 0 && (
              <p className="text-xs" style={{ color: COLORS.inkFaint }}>
                used {action.usageCount} {action.usageCount === 1 ? "time" : "times"}
              </p>
            )}
          </>
        )}
      </div>

      {editing ? (
        <>
          <button onClick={save} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.reflect }}>
            <Check size={13} color="#FFFFFF" />
          </button>
          <button onClick={() => setEditing(false)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.bg }}>
            <X size={13} color={COLORS.inkSoft} />
          </button>
        </>
      ) : (
        <>
          <button onClick={() => onToggleFavorite(action.id)} className="px-1 text-base" style={{ color: action.favorite ? COLORS.pause : COLORS.border }}>
            ♥
          </button>
          <button onClick={() => setEditing(true)} className="px-1">
            <Pencil size={14} color={COLORS.inkSoft} />
          </button>
          <button onClick={() => setConfirmingDelete(true)} className="px-1">
            <Trash2 size={14} color={COLORS.danger} />
          </button>
        </>
      )}
    </div>
  );
}

function ManageActionsScreen({ actions, onBack, onAdd, onEdit, onDelete, onToggleFavorite, onMove }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const sorted = [...actions].sort((a, b) => a.sortOrder - b.sortOrder);

  const submitAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
    setAdding(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader onBack={onBack} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-2 pb-4">
        <h2 className="mb-1 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          Try Instead actions
        </h2>
        <p className="mb-5 text-sm" style={{ color: COLORS.inkSoft }}>
          Favorites and most-used show first during Pause.
        </p>

        <div className="flex flex-col gap-2">
          {sorted.map((action, i) => (
            <ActionRow
              key={action.id}
              action={action}
              index={i}
              count={sorted.length}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              onMove={onMove}
            />
          ))}
        </div>

        {adding ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New action name"
              className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
              style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
            <button onClick={submitAdd} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.reflect }}>
              <Check size={13} color="#FFFFFF" />
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.bg }}
            >
              <X size={13} color={COLORS.inkSoft} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.inkSoft }}
          >
            <Plus size={15} />
            Add action
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- MANAGE URGE TYPES ----------------

function UrgeTypeRow({ urgeType, index, count, onEdit, onDelete, onMove }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(urgeType.name);

  const save = () => {
    if (name.trim()) onEdit(urgeType.id, name.trim());
    setEditing(false);
  };

  if (confirmingDelete) {
    return (
      <div className="rounded-xl px-3 py-2" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <DeleteConfirmBar onCancel={() => setConfirmingDelete(false)} onConfirm={() => onDelete(urgeType.id)} />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex flex-col">
        <button onClick={() => onMove(urgeType.id, -1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.25 : 1 }}>
          <ChevronUp size={14} color={COLORS.inkSoft} />
        </button>
        <button onClick={() => onMove(urgeType.id, 1)} disabled={index === count - 1} style={{ opacity: index === count - 1 ? 0.25 : 1 }}>
          <ChevronDown size={14} color={COLORS.inkSoft} />
        </button>
      </div>

      <div className="flex-1">
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg px-2 py-1 text-sm outline-none"
            style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
          />
        ) : (
          <p className="text-sm font-medium" style={{ color: COLORS.ink }}>
            {urgeType.name}
          </p>
        )}
      </div>

      {editing ? (
        <>
          <button onClick={save} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.reflect }}>
            <Check size={13} color="#FFFFFF" />
          </button>
          <button onClick={() => setEditing(false)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.bg }}>
            <X size={13} color={COLORS.inkSoft} />
          </button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="px-1">
            <Pencil size={14} color={COLORS.inkSoft} />
          </button>
          <button onClick={() => setConfirmingDelete(true)} className="px-1">
            <Trash2 size={14} color={COLORS.danger} />
          </button>
        </>
      )}
    </div>
  );
}

function ManageUrgeTypesScreen({ urgeTypes, onBack, onAdd, onEdit, onDelete, onMove }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const sorted = [...urgeTypes].sort((a, b) => a.sortOrder - b.sortOrder);

  const submitAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
    setAdding(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader onBack={onBack} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-2 pb-4">
        <h2 className="mb-1 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          Urge types
        </h2>
        <p className="mb-5 text-sm" style={{ color: COLORS.inkSoft }}>
          These show as tap options when you pause.
        </p>

        <div className="flex flex-col gap-2">
          {sorted.map((ut, i) => (
            <UrgeTypeRow key={ut.id} urgeType={ut} index={i} count={sorted.length} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
          ))}
        </div>

        {adding ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New urge type"
              className="flex-1 rounded-lg px-2 py-1 text-sm outline-none"
              style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            />
            <button onClick={submitAdd} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.reflect }}>
              <Check size={13} color="#FFFFFF" />
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.bg }}
            >
              <X size={13} color={COLORS.inkSoft} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
            style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.inkSoft }}
          >
            <Plus size={15} />
            Add urge type
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- APP SETTINGS (appearance, backup, erase) ----------------

function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="flex rounded-xl p-1" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 rounded-lg py-2 text-xs font-medium transition-colors"
            style={{
              backgroundColor: active ? COLORS.card : "transparent",
              color: active ? COLORS.ink : COLORS.inkFaint,
              boxShadow: active ? `0 1px 2px rgba(0,0,0,0.06)` : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SettingsRow({ icon, label, tone, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left"
      style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      {icon}
      <span className="text-sm font-medium" style={{ color: tone || COLORS.ink }}>
        {label}
      </span>
    </button>
  );
}

function SettingsScreen({ theme, onSetTheme, onExport, onImportData, onEraseAll, onBack }) {
  const fileInputRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState("");
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const handleFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (typeof parsed !== "object" || parsed === null) throw new Error("Not a valid backup file.");
        setPendingImport(parsed);
      } catch (err) {
        setImportError("That file doesn't look like a NextChoice backup.");
      }
    };
    reader.onerror = () => setImportError("Couldn't read that file.");
    reader.readAsText(file);
  };

  const confirmImport = () => {
    onImportData(pendingImport);
    setPendingImport(null);
    setToast("Backup imported.");
  };

  const confirmErase = () => {
    onEraseAll();
    setConfirmingErase(false);
    setToast("All data erased.");
  };

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader onBack={onBack} />
      <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-2 pb-4">
        <h2 className="mb-5 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          Settings
        </h2>

        {toast && (
          <div className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: COLORS.reflectSoft }}>
            <Check size={14} color={COLORS.reflect} />
            <p className="text-xs font-medium" style={{ color: COLORS.reflect }}>
              {toast}
            </p>
          </div>
        )}

        <p className="mb-2 text-xs" style={{ color: COLORS.inkFaint }}>
          Appearance
        </p>
        <div className="mb-6">
          <SegmentedControl
            value={theme}
            onChange={onSetTheme}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <SettingsRow
            icon={<Download size={16} color={COLORS.inkSoft} />}
            label="Export backup (.json)"
            onClick={onExport}
          />
          <SettingsRow
            icon={<Upload size={16} color={COLORS.inkSoft} />}
            label="Import backup"
            onClick={() => fileInputRef.current?.click()}
          />
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChosen} />

          {importError && <p className="text-xs" style={{ color: COLORS.danger }}>{importError}</p>}
          {pendingImport && (
            <ConfirmBar
              message="Import backup? This will replace all current data."
              confirmLabel="Import"
              onCancel={() => setPendingImport(null)}
              onConfirm={confirmImport}
            />
          )}

          {confirmingErase ? (
            <ConfirmBar
              message="Erase all data? This can't be undone."
              confirmLabel="Erase"
              onCancel={() => setConfirmingErase(false)}
              onConfirm={confirmErase}
            />
          ) : (
            <SettingsRow
              icon={<Trash2 size={16} color={COLORS.danger} />}
              label="Erase all data"
              tone={COLORS.danger}
              onClick={() => setConfirmingErase(true)}
            />
          )}
        </div>

        <p className="mt-6 text-xs leading-relaxed" style={{ color: COLORS.inkFaint }}>
          Your entries are saved to your Claude account and are available wherever you're signed in. Export a backup
          now and then in case you'd ever like a copy outside the app.
        </p>
      </div>
    </div>
  );
}

// ---------------- HOME WEEK STRIP ----------------

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDate(a, b) {
  return a.toDateString() === b.toDateString();
}

// ---------------- INSIGHTS PERIOD FILTER (shared range calc, reused by InsightsHeader + InsightsScreen) ----------------

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const INSIGHTS_PERIODS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "thisWeek", label: "This week" },
  { id: "lastWeek", label: "Last week" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "custom", label: "Custom period" },
];

// Returns { start: Date, end: Date } inclusive, or null for "all time" / an incomplete custom range.
function getInsightsRange(periodId, customStart, customEnd) {
  const now = new Date();
  switch (periodId) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "thisWeek": {
      const monday = getMonday(now);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: startOfDay(monday), end: endOfDay(sunday) };
    }
    case "lastWeek": {
      const monday = getMonday(now);
      monday.setDate(monday.getDate() - 7);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { start: startOfDay(monday), end: endOfDay(sunday) };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "custom": {
      if (!customStart || !customEnd) return null;
      return { start: startOfDay(new Date(customStart)), end: endOfDay(new Date(customEnd)) };
    }
    default:
      return null;
  }
}

function filterByRange(items, dateField, range) {
  if (!range) return items;
  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return false;
    const d = new Date(raw);
    return d >= range.start && d <= range.end;
  });
}

function WeekStrip({ selectedDate, onSelectDate }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();

  const monday = getMonday(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];
  const weekLabel = weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : weekOffset === 1 ? "Next week" : `${days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div className="mb-5 rounded-2xl px-3 py-3" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="mb-3 flex items-center justify-between px-1">
        <button onClick={() => setWeekOffset((o) => o - 1)} aria-label="Previous week">
          <ChevronLeft size={16} color={COLORS.inkFaint} />
        </button>
        <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
          {weekLabel}
        </p>
        <button onClick={() => setWeekOffset((o) => o + 1)} aria-label="Next week">
          <ChevronRight size={16} color={COLORS.inkFaint} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isSelected = sameDate(d, selectedDate);
          return (
            <button key={i} onClick={() => onSelectDate(d)} className="flex flex-col items-center gap-1 py-1">
              <span className="text-[10px]" style={{ color: isSelected ? COLORS.reflect : COLORS.inkFaint }}>
                {dayLetters[i]}
              </span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: isSelected ? COLORS.reflect : "transparent",
                  color: isSelected ? "#FFFFFF" : COLORS.ink,
                }}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- HOME / HISTORY / INSIGHTS ----------------

function HomeScreen({ onPause, onReflect, urges, choices, onOpenEntry }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const todayCount = [...urges, ...choices].filter((e) => {
    const d = new Date(e.startedAt || e.createdAt);
    return d.toDateString() === new Date().toDateString();
  }).length;

  const recent = [...urges, ...choices]
    .filter((e) => {
      const d = new Date(e.startedAt || e.createdAt);
      return d.toDateString() === selectedDate.toDateString();
    })
    .sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt));

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 pb-4 pt-7">
      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="mb-6">
        <p className="text-xs tracking-wide" style={{ color: COLORS.inkFaint }}>
          Today
        </p>
        <h1 className="mt-1 text-2xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          {todayCount === 0 ? "Nothing logged yet today." : `${todayCount} logged today.`}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onPause}
          className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-transform active:scale-[0.98]"
          style={{ backgroundColor: COLORS.pause }}
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.22)" }}>
            <Flame size={22} color="#FFFFFF" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">Pause</p>
            <p className="text-sm text-white" style={{ opacity: 0.85 }}>
              I'm having an urge
            </p>
          </div>
        </button>

        <button
          onClick={onReflect}
          className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-transform active:scale-[0.98]"
          style={{ backgroundColor: COLORS.reflect }}
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.22)" }}>
            <Brain size={22} color="#FFFFFF" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">Reflect</p>
            <p className="text-sm text-white" style={{ opacity: 0.85 }}>
              Log a choice
            </p>
          </div>
        </button>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs tracking-wide" style={{ color: COLORS.inkFaint }}>
          {isToday
            ? "Recent activity"
            : `Activity · ${selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
        </p>
        {recent.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-1 rounded-2xl px-5 py-8 text-center"
            style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              Nothing here yet.
            </p>
            <p className="text-sm" style={{ color: COLORS.inkFaint }}>
              {isToday ? "Your urges and choices will show up here." : "Nothing logged on this date."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((e) => (
              <EntryRow key={e.id} entry={e} onClick={() => onOpenEntry(e)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryRow({ entry, onClick }) {
  const isUrge = "urgeType" in entry;
  const label = isUrge ? entry.urgeType : entry.text;
  const when = new Date(entry.startedAt || entry.createdAt);
  const outcomeLabel = isUrge ? entry.result : outcomeDisplayLabel(entry.outcome);
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-xl px-4 py-3 text-left transition-transform active:scale-[0.98]"
      style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: (isUrge ? COLORS.pause : COLORS.reflect) + "1A" }}
        >
          {isUrge ? <Flame size={14} color={COLORS.pause} /> : <Brain size={14} color={COLORS.reflect} />}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: COLORS.ink }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: COLORS.inkFaint }}>
            {when.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
            {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
      </div>
      {outcomeLabel && (
        <span className="text-xs" style={{ color: COLORS.inkFaint }}>
          {outcomeLabel}
        </span>
      )}
    </button>
  );
}

function HistoryScreen({ urges, choices, onOpenEntry }) {
  const all = [...urges, ...choices].sort(
    (a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt)
  );
  return (
    <div className="flex h-full flex-col pt-7">
      <p className="px-5 pb-4 text-xs tracking-wide" style={{ color: COLORS.inkFaint }}>
        History
      </p>
      {all.length === 0 ? (
        <EmptyState label="No urges or choices logged yet." />
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto px-5 pb-4">
          {all.map((e) => (
            <EntryRow key={e.id} entry={e} onClick={() => onOpenEntry(e)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChartState({ label, height = 130 }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" style={{ height }}>
      <BarChart3 size={22} color={COLORS.border} />
      <p className="text-xs" style={{ color: COLORS.inkFaint }}>
        {label}
      </p>
    </div>
  );
}

function InsightCard({ children, tight }) {
  return (
    <div
      className={tight ? "rounded-[22px] px-5 py-4" : "rounded-[22px] px-5 py-5"}
      style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      {children}
    </div>
  );
}

function InsightCardHeader({ icon: Icon, iconColor, iconBg, title, subtitle, right }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={16} color={iconColor} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: COLORS.ink }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-xs" style={{ color: COLORS.inkFaint }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function InsightCallout({ icon: Icon, children }) {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ backgroundColor: COLORS.reflectSoft }}>
      {Icon && (
        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.card }}>
          <Icon size={12} color={COLORS.reflect} />
        </div>
      )}
      <p className="text-xs leading-relaxed" style={{ color: COLORS.ink }}>
        {children}
      </p>
    </div>
  );
}

// ---------------- HEADER ----------------

function InsightsHeader({ period, onChangePeriod, customStart, customEnd, onChangeCustom }) {
  const [open, setOpen] = useState(false);
  const activeLabel = INSIGHTS_PERIODS.find((p) => p.id === period)?.label || "All time";

  return (
    <div className="relative px-5 pb-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 600 }}>
            Insights
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: COLORS.inkFaint }}>
            Understand your patterns. Celebrate progress.
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5"
          style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
        >
          <CalendarDays size={12} color={COLORS.inkSoft} />
          <span className="text-[11px] font-medium" style={{ color: COLORS.inkSoft }}>
            {activeLabel}
          </span>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-5 top-[52px] z-20 w-56 rounded-2xl p-2"
            style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
          >
            {INSIGHTS_PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onChangePeriod(p.id);
                  if (p.id !== "custom") setOpen(false);
                }}
                className="flex w-full items-center rounded-xl px-3 py-2 text-left text-xs font-medium"
                style={{
                  backgroundColor: period === p.id ? COLORS.reflectSoft : "transparent",
                  color: period === p.id ? COLORS.reflect : COLORS.ink,
                }}
              >
                {p.label}
              </button>
            ))}
            {period === "custom" && (
              <div className="mt-1 flex flex-col gap-2 border-t px-1 pt-2" style={{ borderColor: COLORS.border }}>
                <label className="text-[10px]" style={{ color: COLORS.inkFaint }}>
                  Start
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || undefined}
                    onChange={(e) => onChangeCustom(e.target.value, customEnd)}
                    className="mt-1 w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </label>
                <label className="text-[10px]" style={{ color: COLORS.inkFaint }}>
                  End
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(e) => onChangeCustom(customStart, e.target.value)}
                    className="mt-1 w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
                  />
                </label>
                <button
                  onClick={() => setOpen(false)}
                  disabled={!customStart || !customEnd}
                  className="mt-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity"
                  style={{ backgroundColor: COLORS.reflect, opacity: customStart && customEnd ? 1 : 0.5 }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------- METRIC CARDS ----------------

function MetricCard({ icon: Icon, iconColor, iconBg, value, label, context }) {
  return (
    <div className="rounded-[20px] px-4 py-4" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>
        <Icon size={15} color={iconColor} />
      </div>
      <p className="text-2xl font-semibold leading-none" style={{ color: COLORS.ink }}>
        {value}
      </p>
      <p className="mt-1.5 text-xs" style={{ color: COLORS.inkSoft }}>
        {label}
      </p>
      {context && (
        <p className="mt-1 text-[10px]" style={{ color: COLORS.inkFaint }}>
          {context}
        </p>
      )}
    </div>
  );
}

function MetricGrid({ urges, choices }) {
  const totalEntries = urges.length + choices.length;
  const redirected = urges.filter((u) => u.result === "The urge went away" || u.result === "The urge got weaker").length;
  const redirectedPct = urges.length ? Math.round((redirected / urges.length) * 100) : null;

  const dayKeys = new Set();
  urges.forEach((u) => u.startedAt && dayKeys.add(new Date(u.startedAt).toDateString()));
  choices.forEach((c) => c.createdAt && dayKeys.add(new Date(c.createdAt).toDateString()));

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <MetricCard icon={TrendingUp} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} value={totalEntries} label="Total entries" />
      <MetricCard
        icon={ShieldCheck}
        iconColor={COLORS.reflect}
        iconBg={COLORS.reflectSoft}
        value={redirectedPct == null ? "—" : `${redirectedPct}%`}
        label="Urges redirected"
      />
      <MetricCard icon={Flame} iconColor={COLORS.pause} iconBg={COLORS.pauseSoft} value={dayKeys.size} label="Days active" />
      <MetricCard icon={Star} iconColor={COLORS.gold} iconBg={COLORS.goldSoft} value={choices.length} label="Choices logged" />
    </div>
  );
}

// ---------------- PRIMARY: URGE OUTCOME DOUGHNUT ----------------

function urgeResultStyle() {
  return {
    "The urge went away": COLORS.reflect,
    "The urge got weaker": COLORS.sage,
    "I acted on the urge": COLORS.pause,
    "Not sure": COLORS.neutral,
  };
}

function PrimaryOutcomeCard({ urges }) {
  const total = urges.length;

  if (total === 0) {
    return (
      <InsightCard>
        <InsightCardHeader icon={PieChartIcon} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} title="What happens most often?" subtitle="Outcome of your urges" />
        <EmptyChartState label="Use Pause during an urge to see this." height={160} />
      </InsightCard>
    );
  }

  const counts = { "The urge went away": 0, "The urge got weaker": 0, "I acted on the urge": 0, "Not sure": 0 };
  urges.forEach((u) => {
    if (counts[u.result] != null) counts[u.result] += 1;
  });
  const slices = URGE_RESULTS.map((r) => ({
    id: r,
    label: r,
    value: counts[r],
    color: urgeResultStyle()[r],
  })).filter((s) => s.value > 0);

  const wentAway = counts["The urge went away"];
  const weaker = counts["The urge got weaker"];
  const acted = counts["I acted on the urge"];
  const redirectedShare = (wentAway + weaker) / total;

  let calloutIcon = Leaf;
  let callout;
  if (total < 3) {
    callout = "Keep logging urges to see a clearer pattern here.";
  } else if (redirectedShare >= 0.6) {
    callout = "Great job! You're redirecting most of your urges. Keep using what works for you.";
  } else if (acted / total >= 0.5) {
    calloutIcon = Compass;
    callout = "Urges are winning more often right now. Try reaching for your favorite action earlier next time.";
  } else {
    calloutIcon = Compass;
    callout = "Your outcomes are mixed so far. A few more logged urges will make the pattern clearer.";
  }

  return (
    <InsightCard>
      <InsightCardHeader icon={PieChartIcon} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} title="What happens most often?" subtitle="Outcome of your urges" />
      <div className="flex items-center gap-5">
        {/* Fixed pixel dimensions on both the wrapper and the chart itself (rather than
            ResponsiveContainer's 100%/100%) avoid a 0-width first paint inside this
            flex row, which was why the doughnut sometimes failed to render. */}
        <div className="relative h-[150px] w-[150px] flex-shrink-0">
          <PieChart width={150} height={150}>
            <Pie data={slices} dataKey="value" innerRadius={48} outerRadius={72} startAngle={90} endAngle={-270} stroke="none">
              {slices.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold" style={{ color: COLORS.ink }}>
              {total}
            </p>
            <p className="text-[10px]" style={{ color: COLORS.inkFaint }}>
              Total
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5">
          {slices.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-xs leading-tight" style={{ color: COLORS.inkSoft }}>
                {s.label}
              </span>
              <span className="whitespace-nowrap text-xs font-medium" style={{ color: COLORS.ink }}>
                {s.value} ({Math.round((s.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      <InsightCallout icon={calloutIcon}>{callout}</InsightCallout>
    </InsightCard>
  );
}

// ---------------- WHAT HELPS THE MOST ----------------

function ActionSuccessCard({ urges, actions }) {
  const rows = actions
    .map((a) => {
      const used = urges.filter((u) => u.selectedActionId === a.id);
      const usage = used.length;
      const success = used.filter((u) => u.result === "The urge went away" || u.result === "The urge got weaker").length;
      return { id: a.id, name: a.name, usage, success, rate: usage ? success / usage : 0 };
    })
    .filter((a) => a.usage > 0)
    .sort((a, b) => (b.rate === a.rate ? b.usage - a.usage : b.rate - a.rate))
    .slice(0, 6);

  return (
    <InsightCard>
      <InsightCardHeader icon={Leaf} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} title="What helps the most?" subtitle="Success rate by your Try Instead actions" />
      {rows.length === 0 ? (
        <EmptyChartState label="Use a Try Instead action during Pause to see this." height={110} />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const pct = Math.round(r.rate * 100);
            return (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-[92px] flex-shrink-0 truncate text-xs" style={{ color: COLORS.ink }}>
                  {r.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: COLORS.neutralSoft }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS.reflect }} />
                </div>
                <span className="w-[38px] flex-shrink-0 text-right text-[11px]" style={{ color: COLORS.inkFaint }}>
                  {r.success}/{r.usage}
                </span>
                <span className="w-[34px] flex-shrink-0 text-right text-xs font-semibold" style={{ color: COLORS.ink }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2">
        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: COLORS.reflect }} />
        <p className="text-[11px]" style={{ color: COLORS.inkFaint }}>
          Success rate = urge went away or got weaker
        </p>
      </div>
    </InsightCard>
  );
}

// ---------------- HOW DO YOU DECIDE ----------------

function DecisionOutcomeCard({ choices }) {
  const groups = {};
  DECISION_MODES.forEach((m) => {
    groups[m.id] = { helpful: 0, unhelpful: 0, too_early: 0, total: 0 };
  });
  choices.forEach((c) => {
    if (!c.decisionMode || !groups[c.decisionMode]) return;
    if (groups[c.decisionMode][c.outcome] != null) groups[c.decisionMode][c.outcome] += 1;
    groups[c.decisionMode].total += 1;
  });
  const data = DECISION_MODES.filter((m) => groups[m.id].total > 0).map((m) => ({
    mode: m.id,
    label: SHORT_DECISION_LABELS[m.id],
    helpful: groups[m.id].helpful,
    unhelpful: groups[m.id].unhelpful,
    too_early: groups[m.id].too_early,
    rate: groups[m.id].total ? groups[m.id].helpful / groups[m.id].total : 0,
    total: groups[m.id].total,
  }));

  let callout = "You're still building enough data to see a clear pattern.";
  const confident = data.filter((d) => d.total >= 2).sort((a, b) => b.rate - a.rate);
  if (confident.length >= 2 && confident[0].rate - confident[1].rate >= 0.15) {
    callout = `${confident[0].label} leads to better outcomes for you.`;
  } else if (confident.length === 1 && confident[0].total >= 3 && confident[0].rate >= 0.6) {
    callout = `${confident[0].label} has been working well for you.`;
  }

  return (
    <InsightCard>
      <InsightCardHeader icon={Brain} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} title="How do you decide?" subtitle="Decision mode vs. outcome" />
      {data.length === 0 ? (
        <EmptyChartState label="Reflect on a few choices to see this." height={140} />
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            {[
              { label: "Helped", color: COLORS.reflect },
              { label: "Didn't help", color: COLORS.pause },
              { label: "Too soon", color: COLORS.neutral },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[10px]" style={{ color: COLORS.inkFaint }}>
                  {l.label}
                </span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: COLORS.inkFaint }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="helpful" stackId="a" fill={COLORS.reflect} radius={[0, 0, 0, 0]} maxBarSize={36} />
              <Bar dataKey="unhelpful" stackId="a" fill={COLORS.pause} maxBarSize={36} />
              <Bar dataKey="too_early" stackId="a" fill={COLORS.neutral} radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
      <InsightCallout icon={Compass}>{callout}</InsightCallout>
    </InsightCard>
  );
}

// ---------------- ACTIVITY OVER TIME ----------------

function ActivityTrendCard({ urges, choices }) {
  const all = [...urges.map((u) => u.startedAt), ...choices.map((c) => c.createdAt)].filter(Boolean);
  const byDay = {};
  all.forEach((iso) => {
    const key = new Date(iso).toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  });
  const days = Object.keys(byDay).sort();
  const recentDays = days.slice(-7);
  const data = recentDays.map((key) => {
    const d = new Date(key);
    return { date: d.toLocaleDateString(undefined, { weekday: "short" }), full: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count: byDay[key] };
  });

  const byWeekday = {};
  all.forEach((iso) => {
    const wd = new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
    byWeekday[wd] = (byWeekday[wd] || 0) + 1;
  });
  const weekdayEntries = Object.entries(byWeekday).sort((a, b) => b[1] - a[1]);
  let callout = "Keep logging to spot your rhythms.";
  if (all.length >= 5 && weekdayEntries.length > 1 && weekdayEntries[0][1] > weekdayEntries[1][1]) {
    callout = `You tend to be most active on ${weekdayEntries[0][0]}s.`;
  } else if (all.length >= 5) {
    callout = "Your activity is fairly even across the week.";
  }

  return (
    <InsightCard>
      <InsightCardHeader icon={Compass} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} title="Activity over time" subtitle="Entries per day" />
      {data.length === 0 ? (
        <EmptyChartState label="Log something to see this." height={130} />
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: COLORS.inkFaint }} axisLine={{ stroke: COLORS.border }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: COLORS.inkFaint }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.card }}
              labelStyle={{ color: COLORS.ink }}
              formatter={(v) => [v, "Entries"]}
            />
            <Line type="monotone" dataKey="count" stroke={COLORS.reflect} strokeWidth={2} dot={{ r: 3, fill: COLORS.reflect }} />
          </LineChart>
        </ResponsiveContainer>
      )}
      <InsightCallout icon={TrendingUp}>{callout}</InsightCallout>
    </InsightCard>
  );
}

// ---------------- URGE TYPE BREAKDOWN ----------------

const URGE_TYPE_ICONS = {
  "Porn / sexual content": EyeOff,
  "YouTube / scrolling": Smartphone,
  Entertainment: Tv,
  Spending: ShoppingBag,
  Food: UtensilsCrossed,
  Gaming: Gamepad2,
  "Avoiding something": Footprints,
  Custom: MoreHorizontal,
};

function UrgeTypeBreakdownCard({ urges }) {
  const total = urges.length;
  const counts = {};
  urges.forEach((u) => {
    const key = URGE_TYPE_ICONS[u.urgeType] ? u.urgeType : "Custom";
    counts[key] = (counts[key] || 0) + 1;
  });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <InsightCard>
      <InsightCardHeader icon={Atom} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} title="Urge types breakdown" subtitle="Where your urges come from" />
      {total === 0 ? (
        <EmptyChartState label="Log a few urges to see this." height={100} />
      ) : (
        <div className="flex flex-wrap gap-x-5 gap-y-4">
          {rows.map(([type, count]) => {
            const Icon = URGE_TYPE_ICONS[type] || MoreHorizontal;
            return (
              <div key={type} className="flex w-[70px] flex-col items-center gap-1.5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.sageSoft }}>
                  <Icon size={16} color={COLORS.reflect} />
                </div>
                <p className="text-[10px] leading-tight" style={{ color: COLORS.inkSoft }}>
                  {type}
                </p>
                <p className="text-[11px] font-semibold" style={{ color: COLORS.ink }}>
                  {count} ({Math.round((count / total) * 100)}%)
                </p>
              </div>
            );
          })}
        </div>
      )}
    </InsightCard>
  );
}

// ---------------- PATTERN TRACKER ----------------

function PatternTrackerRow({ type, urges, actions, expanded, onToggle }) {
  const counts = { "The urge went away": 0, "The urge got weaker": 0, "I acted on the urge": 0, "Not sure": 0 };
  urges.forEach((u) => {
    if (counts[u.result] != null) counts[u.result] += 1;
  });
  const total = urges.length;

  const byAction = {};
  urges.forEach((u) => {
    if (!u.selectedActionId) return;
    if (!byAction[u.selectedActionId]) byAction[u.selectedActionId] = { usage: 0, success: 0 };
    byAction[u.selectedActionId].usage += 1;
    if (u.result === "The urge went away" || u.result === "The urge got weaker") byAction[u.selectedActionId].success += 1;
  });
  const best = Object.entries(byAction)
    .filter(([, v]) => v.usage >= 2)
    .map(([id, v]) => ({ id, ...v, rate: v.success / v.usage }))
    .sort((a, b) => b.rate - a.rate)[0];
  const bestAction = best ? actions.find((a) => a.id === best.id) : null;

  return (
    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <button className="flex w-full items-center justify-between" onClick={onToggle}>
        <div className="text-left">
          <p className="text-xs font-semibold" style={{ color: COLORS.ink }}>
            {type}
          </p>
          <p className="text-[11px]" style={{ color: COLORS.inkFaint }}>
            {total} {total === 1 ? "time" : "times"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-1.5 w-16 overflow-hidden rounded-full" style={{ backgroundColor: COLORS.neutralSoft }}>
            {URGE_RESULTS.map((r) =>
              counts[r] > 0 ? (
                <div key={r} style={{ width: `${(counts[r] / total) * 100}%`, backgroundColor: urgeResultStyle()[r] }} />
              ) : null
            )}
          </div>
          {expanded ? <ChevronUp size={14} color={COLORS.inkFaint} /> : <ChevronDown size={14} color={COLORS.inkFaint} />}
        </div>
      </button>
      {expanded && (
        <div className="mt-3 flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: COLORS.border }}>
          {URGE_RESULTS.filter((r) => counts[r] > 0).map((r) => (
            <div key={r} className="flex items-center justify-between text-[11px]">
              <span style={{ color: COLORS.inkSoft }}>{r}</span>
              <span className="font-medium" style={{ color: COLORS.ink }}>
                {counts[r]}
              </span>
            </div>
          ))}
          <div className="mt-1.5 flex items-center justify-between border-t pt-1.5 text-[11px]" style={{ borderColor: COLORS.border }}>
            <span style={{ color: COLORS.inkFaint }}>Works best</span>
            <span className="font-medium" style={{ color: COLORS.ink }}>
              {bestAction ? `${bestAction.name} · ${best.success}/${best.usage}` : "Not enough data yet"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PatternTrackerCard({ urges, actions }) {
  const [expandedType, setExpandedType] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const byType = {};
  urges.forEach((u) => {
    const key = URGE_TYPE_ICONS[u.urgeType] ? u.urgeType : u.urgeType || "Custom";
    if (!byType[key]) byType[key] = [];
    byType[key].push(u);
  });
  const groups = Object.entries(byType).sort((a, b) => b[1].length - a[1].length);
  const visible = showAll ? groups : groups.slice(0, 4);

  return (
    <InsightCard>
      <InsightCardHeader icon={Fingerprint} iconColor={COLORS.reflect} iconBg={COLORS.reflectSoft} title="Pattern tracker" subtitle="Understand yourself, urge type by urge type" />
      {groups.length === 0 ? (
        <EmptyChartState label="Log a few urges to see this." height={100} />
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map(([type, list]) => (
            <PatternTrackerRow
              key={type}
              type={type}
              urges={list}
              actions={actions}
              expanded={expandedType === type}
              onToggle={() => setExpandedType(expandedType === type ? null : type)}
            />
          ))}
          {groups.length > 4 && !showAll && (
            <button onClick={() => setShowAll(true)} className="mt-1 text-center text-xs font-medium" style={{ color: COLORS.reflect }}>
              Show all urge types
            </button>
          )}
        </div>
      )}
    </InsightCard>
  );
}

// ---------------- INSIGHTS SCREEN ----------------

function InsightsScreen({ urges, choices, actions }) {
  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = getInsightsRange(period, customStart, customEnd);
  const filteredUrges = filterByRange(urges, "startedAt", range);
  const filteredChoices = filterByRange(choices, "createdAt", range);
  const total = filteredUrges.length + filteredChoices.length;

  const headerProps = {
    period,
    onChangePeriod: setPeriod,
    customStart,
    customEnd,
    onChangeCustom: (s, e) => {
      setCustomStart(s);
      setCustomEnd(e);
    },
  };

  if (total === 0) {
    return (
      <div className="flex h-full flex-col pt-6">
        <InsightsHeader {...headerProps} />
        <EmptyState
          label={period === "all" ? "Log a few urges or choices to see your patterns." : "Nothing logged in this period."}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto pt-6">
      <InsightsHeader {...headerProps} />
      <div className="flex flex-col gap-3 px-5 pb-6">
        <MetricGrid urges={filteredUrges} choices={filteredChoices} />
        <PrimaryOutcomeCard urges={filteredUrges} />
        <ActionSuccessCard urges={filteredUrges} actions={actions} />
        <div className="grid grid-cols-1 gap-3">
          <DecisionOutcomeCard choices={filteredChoices} />
          <ActivityTrendCard urges={filteredUrges} choices={filteredChoices} />
        </div>
        <UrgeTypeBreakdownCard urges={filteredUrges} />
        <PatternTrackerCard urges={filteredUrges} actions={actions} />
      </div>
    </div>
  );
}


export default function NextChoiceApp() {
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null);
  const [detailEntry, setDetailEntry] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [data, persist, status] = useAppData();

  const { urges, choices, actions, choicePresets, urgeTypes } = data;
  const theme = data.settings?.theme || "system";
  const loading = status === "loading";
  const unavailable = status === "unavailable";

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mql.matches);
    const handler = (e) => setSystemPrefersDark(e.matches);
    mql.addEventListener ? mql.addEventListener("change", handler) : mql.addListener(handler);
    return () => {
      mql.removeEventListener ? mql.removeEventListener("change", handler) : mql.removeListener(handler);
    };
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark);
  Object.assign(COLORS, isDark ? DARK_PALETTE : LIGHT_PALETTE);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const openEntry = (entry) => {
    const type = "urgeType" in entry ? "urge" : "choice";
    setDetailEntry({ type, id: entry.id });
  };

  const setTheme = (value) => {
    persist({ ...data, settings: { ...data.settings, theme: value } });
  };

  const exportBackup = () => {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `nextchoice-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("NextChoice: export failed.", e);
    }
  };

  const importBackup = (parsed) => {
    const sanitized = {
      urges: Array.isArray(parsed.urges) ? parsed.urges : [],
      choices: Array.isArray(parsed.choices) ? parsed.choices : [],
      actions: Array.isArray(parsed.actions) && parsed.actions.length ? parsed.actions : DEFAULT_ACTIONS,
      choicePresets:
        Array.isArray(parsed.choicePresets) && parsed.choicePresets.length ? parsed.choicePresets : DEFAULT_CHOICE_PRESETS,
      urgeTypes: Array.isArray(parsed.urgeTypes) && parsed.urgeTypes.length ? parsed.urgeTypes : DEFAULT_URGE_TYPES,
      settings: parsed.settings && typeof parsed.settings === "object" ? { ...DEFAULT_SETTINGS, ...parsed.settings } : data.settings,
    };
    persist(sanitized);
  };

  const eraseAllData = () => {
    persist({ ...DEFAULT_DATA, settings: data.settings });
  };

  const handlePauseComplete = (urgeRecord) => {
    const updatedActions = actions.map((a) => {
      if (a.id !== urgeRecord.selectedActionId) return a;
      const wasUseful = urgeRecord.result !== "Not sure";
      return {
        ...a,
        usageCount: a.usageCount + 1,
        successCount: a.successCount + (wasUseful ? 1 : 0),
      };
    });
    persist({ ...data, urges: [urgeRecord, ...urges], actions: updatedActions });
    setOverlay(null);
    setJustSaved(true);
  };

  const handleReflectComplete = (choiceRecord) => {
    persist({ ...data, choices: [choiceRecord, ...choices] });
    setOverlay(null);
    setJustSaved(true);
  };

  const saveUrge = (updated) => {
    persist({ ...data, urges: urges.map((u) => (u.id === updated.id ? updated : u)) });
  };

  const saveChoice = (updated) => {
    persist({ ...data, choices: choices.map((c) => (c.id === updated.id ? updated : c)) });
  };

  const deleteUrge = (id) => {
    persist({ ...data, urges: urges.filter((u) => u.id !== id) });
    setDetailEntry(null);
  };

  const deleteChoice = (id) => {
    persist({ ...data, choices: choices.filter((c) => c.id !== id) });
    setDetailEntry(null);
  };

  const addAction = (name) => {
    const maxSort = actions.reduce((m, a) => Math.max(m, a.sortOrder), -1);
    const newAction = {
      id: uid(),
      name,
      active: true,
      favorite: false,
      sortOrder: maxSort + 1,
      applicableUrgeTypes: [],
      usageCount: 0,
      successCount: 0,
    };
    persist({ ...data, actions: [...actions, newAction] });
  };

  const editActionName = (id, name) => {
    persist({ ...data, actions: actions.map((a) => (a.id === id ? { ...a, name } : a)) });
  };

  const deleteAction = (id) => {
    persist({ ...data, actions: actions.filter((a) => a.id !== id) });
  };

  const toggleFavorite = (id) => {
    persist({ ...data, actions: actions.map((a) => (a.id === id ? { ...a, favorite: !a.favorite } : a)) });
  };

  const moveAction = (id, direction) => {
    const sorted = [...actions].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((a) => a.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[swapIndex];
    const updated = actions.map((act) => {
      if (act.id === a.id) return { ...act, sortOrder: b.sortOrder };
      if (act.id === b.id) return { ...act, sortOrder: a.sortOrder };
      return act;
    });
    persist({ ...data, actions: updated });
  };

  const addPreset = (text) => {
    const maxSort = choicePresets.reduce((m, p) => Math.max(m, p.sortOrder), -1);
    const newPreset = { id: uid(), text, sortOrder: maxSort + 1, usageCount: 0 };
    persist({ ...data, choicePresets: [...choicePresets, newPreset] });
  };

  const editPresetText = (id, text) => {
    persist({ ...data, choicePresets: choicePresets.map((p) => (p.id === id ? { ...p, text } : p)) });
  };

  const deletePreset = (id) => {
    persist({ ...data, choicePresets: choicePresets.filter((p) => p.id !== id) });
  };

  const movePreset = (id, direction) => {
    const sorted = [...choicePresets].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((p) => p.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[swapIndex];
    const updated = choicePresets.map((p) => {
      if (p.id === a.id) return { ...p, sortOrder: b.sortOrder };
      if (p.id === b.id) return { ...p, sortOrder: a.sortOrder };
      return p;
    });
    persist({ ...data, choicePresets: updated });
  };

  const usePreset = (id) => {
    persist({ ...data, choicePresets: choicePresets.map((p) => (p.id === id ? { ...p, usageCount: (p.usageCount || 0) + 1 } : p)) });
  };

  const addUrgeType = (name) => {
    const maxSort = urgeTypes.reduce((m, t) => Math.max(m, t.sortOrder), -1);
    persist({ ...data, urgeTypes: [...urgeTypes, { id: uid(), name, sortOrder: maxSort + 1 }] });
  };

  const editUrgeTypeName = (id, name) => {
    persist({ ...data, urgeTypes: urgeTypes.map((t) => (t.id === id ? { ...t, name } : t)) });
  };

  const deleteUrgeType = (id) => {
    persist({ ...data, urgeTypes: urgeTypes.filter((t) => t.id !== id) });
  };

  const moveUrgeType = (id, direction) => {
    const sorted = [...urgeTypes].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((t) => t.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[swapIndex];
    const updated = urgeTypes.map((t) => {
      if (t.id === a.id) return { ...t, sortOrder: b.sortOrder };
      if (t.id === b.id) return { ...t, sortOrder: a.sortOrder };
      return t;
    });
    persist({ ...data, urgeTypes: updated });
  };

  let screen;
  if (loading) {
    screen = <LoadingState />;
  } else if (detailEntry) {
    if (detailEntry.type === "urge") {
      const urge = urges.find((u) => u.id === detailEntry.id);
      screen = urge ? (
        <UrgeDetailScreen urge={urge} onBack={() => setDetailEntry(null)} onSave={saveUrge} onDelete={deleteUrge} />
      ) : (
        <EmptyState label="This entry was deleted." />
      );
    } else {
      const choice = choices.find((c) => c.id === detailEntry.id);
      screen = choice ? (
        <ChoiceDetailScreen choice={choice} onBack={() => setDetailEntry(null)} onSave={saveChoice} onDelete={deleteChoice} />
      ) : (
        <EmptyState label="This entry was deleted." />
      );
    }
  } else if (overlay === "pause") {
    screen = (
      <PauseFlow
        actions={actions}
        urgeTypes={urgeTypes}
        onCancel={() => setOverlay(null)}
        onComplete={handlePauseComplete}
        onEditUrgeTypes={() => setOverlay("manageUrgeTypes")}
      />
    );
  } else if (overlay === "manageUrgeTypes") {
    screen = (
      <ManageUrgeTypesScreen
        urgeTypes={urgeTypes}
        onBack={() => setOverlay("pause")}
        onAdd={addUrgeType}
        onEdit={editUrgeTypeName}
        onDelete={deleteUrgeType}
        onMove={moveUrgeType}
      />
    );
  } else if (overlay === "reflect") {
    screen = (
      <ReflectFlow
        presets={choicePresets}
        onCancel={() => setOverlay(null)}
        onComplete={handleReflectComplete}
        onAddPreset={addPreset}
        onEditPreset={editPresetText}
        onDeletePreset={deletePreset}
        onMovePreset={movePreset}
        onUsePreset={usePreset}
      />
    );
  } else if (overlay === "manageActions") {
    screen = (
      <ManageActionsScreen
        actions={actions}
        onBack={() => setOverlay(null)}
        onAdd={addAction}
        onEdit={editActionName}
        onDelete={deleteAction}
        onToggleFavorite={toggleFavorite}
        onMove={moveAction}
      />
    );
  } else if (overlay === "appSettings") {
    screen = (
      <SettingsScreen
        theme={theme}
        onSetTheme={setTheme}
        onExport={exportBackup}
        onImportData={importBackup}
        onEraseAll={eraseAllData}
        onBack={() => setOverlay(null)}
      />
    );
  } else if (tab === "home") {
    screen = (
      <HomeScreen
        onPause={() => setOverlay("pause")}
        onReflect={() => setOverlay("reflect")}
        urges={urges}
        choices={choices}
        onOpenEntry={openEntry}
      />
    );
  } else if (tab === "history") {
    screen = <HistoryScreen urges={urges} choices={choices} onOpenEntry={openEntry} />;
  } else {
    screen = <InsightsScreen urges={urges} choices={choices} actions={actions} />;
  }

  const chromeHidden = overlay || detailEntry;

  return (
    <div
      className="mx-auto flex h-[720px] w-full max-w-sm flex-col overflow-hidden rounded-[28px]"
      style={{ backgroundColor: COLORS.bg, fontFamily: "'Inter', sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>

      {!chromeHidden && (
        <div className="flex items-center justify-between px-5 pt-5">
          <p style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 600 }} className="text-lg">
            NextChoice
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOverlay("manageActions")}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
              aria-label="Try Instead actions"
            >
              <ListChecks size={16} color={COLORS.inkSoft} />
            </button>
            <button
              onClick={() => setOverlay("appSettings")}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
              aria-label="Settings"
            >
              <Settings size={16} color={COLORS.inkSoft} />
            </button>
          </div>
        </div>
      )}

      {!chromeHidden && !loading && unavailable && <UnavailableBanner />}

      {!chromeHidden && justSaved && (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: COLORS.pauseSoft }}>
          <Check size={14} color={COLORS.pause} />
          <p className="text-xs font-medium" style={{ color: COLORS.pause }}>
            Logged.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">{screen}</div>

      {!chromeHidden && (
        <div
          className="flex items-center justify-around px-2 py-3"
          style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: "#FBFAF7" }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} className="flex flex-col items-center gap-1 rounded-xl px-4 py-1.5">
                <Icon size={20} color={active ? COLORS.reflect : COLORS.inkFaint} />
                <span className="text-[11px]" style={{ color: active ? COLORS.reflect : COLORS.inkFaint, fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
