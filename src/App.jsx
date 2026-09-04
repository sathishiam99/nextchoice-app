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

// Editable via ManageUrgeTypesScreen (add/edit/delete/reorder), same pattern
// as choicePresets. "Custom" is not part of this list — it's always shown as
// a fixed, non-editable final option in the Pause urge picker.
const DEFAULT_URGE_TYPES = [
  { id: "u1", text: "Porn / sexual content", sortOrder: 0 },
  { id: "u2", text: "YouTube / scrolling", sortOrder: 1 },
  { id: "u3", text: "Entertainment", sortOrder: 2 },
  { id: "u4", text: "Spending", sortOrder: 3 },
  { id: "u5", text: "Food", sortOrder: 4 },
  { id: "u6", text: "Gaming", sortOrder: 5 },
  { id: "u7", text: "Avoiding something", sortOrder: 6 },
];

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

// Urge type records are keyed by `text`. Earlier versions of this app (and any
// backup exported from them) stored this same list under a `name` key instead,
// or as plain strings. Without this normalization, records saved under the old
// shape have no `text` field and render as blank buttons on the Pause screen.
function normalizeUrgeTypes(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_URGE_TYPES;
  const normalized = raw
    .map((t, i) => {
      if (typeof t === "string") {
        return t.trim() ? { id: uid(), text: t.trim(), sortOrder: i } : null;
      }
      if (t && typeof t === "object") {
        const text = typeof t.text === "string" && t.text.trim() ? t.text.trim() : typeof t.name === "string" && t.name.trim() ? t.name.trim() : "";
        if (!text) return null;
        return { id: t.id || uid(), text, sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : i };
      }
      return null;
    })
    .filter(Boolean);
  return normalized.length ? normalized : DEFAULT_URGE_TYPES;
}

function outcomeDisplayLabel(outcome) {
  const found = OUTCOMES.find((o) => o.id === outcome);
  return found ? found.label : outcome;
}

function urgeResultShort(result) {
  switch (result) {
    case "The urge went away":
      return "Went away";
    case "The urge got weaker":
      return "Weakened";
    case "I acted on the urge":
      return "Acted on it";
    default:
      return "Not sure";
  }
}

const REDIRECTED_RESULTS = new Set(["The urge went away", "The urge got weaker"]);

// Success must be derived from actual urge outcome records, not the `successCount`
// field on the action itself. That field was previously incremented for any result
// other than "Not sure" — including "I acted on the urge", where the action did NOT
// help — which silently inflated every action's reported success rate.
function computeActionStats(urges, actions) {
  const usage = new Map();
  urges.forEach((u) => {
    if (!u.selectedActionId) return;
    if (!usage.has(u.selectedActionId)) usage.set(u.selectedActionId, { usageCount: 0, successCount: 0 });
    const stat = usage.get(u.selectedActionId);
    stat.usageCount += 1;
    if (REDIRECTED_RESULTS.has(u.result)) stat.successCount += 1;
  });
  return actions.map((a) => {
    const stat = usage.get(a.id) || { usageCount: 0, successCount: 0 };
    return { ...a, usageCount: stat.usageCount, successCount: stat.successCount, rate: stat.usageCount ? stat.successCount / stat.usageCount : 0 };
  });
}

function computeUrgePatterns(urges, actions) {
  const actionNameById = new Map(actions.map((a) => [a.id, a.name]));
  const byType = new Map();

  urges.forEach((u) => {
    const key = u.urgeType || "Other";
    if (!byType.has(key)) {
      byType.set(key, { type: key, count: 0, redirected: 0, acted: 0, notSure: 0, actionStats: new Map() });
    }
    const entry = byType.get(key);
    entry.count += 1;
    const wasRedirected = REDIRECTED_RESULTS.has(u.result);
    if (wasRedirected) entry.redirected += 1;
    else if (u.result === "I acted on the urge") entry.acted += 1;
    else entry.notSure += 1;

    const actionName = (u.selectedActionId && actionNameById.get(u.selectedActionId)) || u.helpfulAction;
    if (actionName) {
      if (!entry.actionStats.has(actionName)) entry.actionStats.set(actionName, { used: 0, worked: 0 });
      const stat = entry.actionStats.get(actionName);
      stat.used += 1;
      if (wasRedirected) stat.worked += 1;
    }
  });

  return [...byType.values()]
    .map((entry) => {
      let bestAction = null;
      for (const [name, stat] of entry.actionStats.entries()) {
        const rate = stat.worked / stat.used;
        if (!bestAction || rate > bestAction.rate || (rate === bestAction.rate && stat.used > bestAction.used)) {
          bestAction = { name, used: stat.used, worked: stat.worked, rate };
        }
      }
      return { ...entry, bestAction };
    })
    .sort((a, b) => b.count - a.count);
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
            urgeTypes: normalizeUrgeTypes(parsed.urgeTypes),
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

function PauseFlow({ actions, urgeTypes, onCancel, onComplete, onAddUrgeType, onEditUrgeType, onDeleteUrgeType, onMoveUrgeType }) {
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

  if (step === "manageUrgeTypes") {
    return (
      <ManagePresetsScreen
        presets={urgeTypes}
        title="Urge types"
        subtitle="These show as tap options when you pause."
        addLabel="Add urge type"
        addPlaceholder="New urge type"
        onBack={() => setStep("urge")}
        onAdd={onAddUrgeType}
        onEdit={onEditUrgeType}
        onDelete={onDeleteUrgeType}
        onMove={onMoveUrgeType}
      />
    );
  }

  if (step === "urge") {
    const sortedUrgeTypes = [...urgeTypes].sort((a, b) => a.sortOrder - b.sortOrder);
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader onBack={onCancel} />
        <div className="flex flex-1 flex-col px-5 pt-2">
          <h2 className="mb-1 text-xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
            What's going on?
          </h2>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              Pick what you're feeling drawn to right now.
            </p>
            <button onClick={() => setStep("manageUrgeTypes")} className="flex-shrink-0 text-xs font-medium" style={{ color: COLORS.pause }}>
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pb-4">
            {sortedUrgeTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => pickUrge(type.text)}
                className="rounded-xl px-4 py-4 text-left text-sm font-medium transition-transform active:scale-[0.97]"
                style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
              >
                {type.text}
              </button>
            ))}
            <button
              onClick={() => pickUrge("Custom")}
              className="rounded-xl px-4 py-4 text-left text-sm font-medium transition-transform active:scale-[0.97]"
              style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.ink }}
            >
              Custom
            </button>
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

function ManagePresetsScreen({
  presets,
  onBack,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  title = "Quick choices",
  subtitle = "These show as tap-to-fill options when logging a choice.",
  addLabel = "Add quick choice",
  addPlaceholder = "New quick choice",
}) {
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
          {title}
        </h2>
        <p className="mb-5 text-sm" style={{ color: COLORS.inkSoft }}>
          {subtitle}
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
              placeholder={addPlaceholder}
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
            {addLabel}
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
  const today = new Date();
  const isToday = sameDate(selectedDate, today);
  const isYesterday = (() => {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return sameDate(selectedDate, y);
  })();

  const dayLabel = isToday
    ? "Today"
    : isYesterday
    ? "Yesterday"
    : selectedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const dayEntries = [...urges, ...choices]
    .filter((e) => sameDate(new Date(e.startedAt || e.createdAt), selectedDate))
    .sort((a, b) => new Date(b.startedAt || b.createdAt) - new Date(a.startedAt || a.createdAt));

  return (
    <div className="flex h-full flex-col overflow-y-auto px-5 pb-4 pt-7">
      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="mb-6">
        <p className="text-xs tracking-wide" style={{ color: COLORS.inkFaint }}>
          {dayLabel}
        </p>
        <h1 className="mt-1 text-2xl" style={{ fontFamily: "'Newsreader', serif", color: COLORS.ink, fontWeight: 500 }}>
          {dayEntries.length === 0
            ? isToday
              ? "Nothing logged yet today."
              : "Nothing logged that day."
            : `${dayEntries.length} logged ${isToday ? "today" : isYesterday ? "yesterday" : "that day"}.`}
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
          {isToday ? "Recent activity" : `Activity · ${dayLabel}`}
        </p>
        {dayEntries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-1 rounded-2xl px-5 py-8 text-center"
            style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              Nothing here yet.
            </p>
            <p className="text-sm" style={{ color: COLORS.inkFaint }}>
              {isToday ? "Your urges and choices will show up here." : "No urges or choices logged on this day."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEntries.map((e) => (
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

function InsightCard({ children }) {
  return (
    <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      {children}
    </div>
  );
}

function MiniScrollBox({ children, maxHeight = "8.5rem" }) {
  return (
    <div
      className="mt-3 overflow-y-auto rounded-xl"
      style={{ maxHeight, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.bg }}
    >
      {children}
    </div>
  );
}

function MiniScrollRow({ left, right, isFirst }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 text-xs"
      style={{ borderTop: isFirst ? "none" : `1px solid ${COLORS.border}` }}
    >
      <span style={{ color: COLORS.ink }}>{left}</span>
      <span style={{ color: COLORS.inkFaint }}>{right}</span>
    </div>
  );
}

function OutcomeDoughnut({ choices }) {
  const total = choices.length;

  if (total === 0) {
    return (
      <InsightCard>
        <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
          How your choices turned out
        </p>
        <EmptyChartState label="Reflect on a choice to see this." />
      </InsightCard>
    );
  }

  const counts = { helpful: 0, unhelpful: 0, too_early: 0 };
  choices.forEach((c) => {
    if (counts[c.outcome] != null) counts[c.outcome] += 1;
  });
  const slices = [
    { id: "helpful", label: "It helped", value: counts.helpful, color: COLORS.reflect },
    { id: "unhelpful", label: "It didn't help", value: counts.unhelpful, color: COLORS.pause },
    { id: "too_early", label: "Too soon to tell", value: counts.too_early, color: COLORS.neutral },
  ].filter((s) => s.value > 0);
  const helpfulPct = total ? Math.round((counts.helpful / total) * 100) : 0;

  return (
    <InsightCard>
      <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
        How your choices turned out
      </p>
      <div className="flex items-center gap-4">
        <div className="relative h-[110px] w-[110px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" innerRadius={32} outerRadius={50} startAngle={90} endAngle={-270} stroke="none">
                {slices.map((s) => (
                  <Cell key={s.id} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-semibold" style={{ color: COLORS.ink }}>
              {helpfulPct}%
            </p>
            <p className="text-[10px]" style={{ color: COLORS.inkFaint }}>
              helped
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          {slices.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1 text-xs" style={{ color: COLORS.inkSoft }}>
                {s.label}
              </span>
              <span className="text-xs font-medium" style={{ color: COLORS.ink }}>
                {Math.round((s.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </InsightCard>
  );
}

function DecisionModeChart({ choices }) {
  const groups = { autopilot: { total: 0, helpful: 0 }, thought_through: { total: 0, helpful: 0 }, gut: { total: 0, helpful: 0 } };
  choices.forEach((c) => {
    if (!c.decisionMode || !groups[c.decisionMode]) return;
    groups[c.decisionMode].total += 1;
    if (c.outcome === "helpful") groups[c.decisionMode].helpful += 1;
  });
  const data = Object.entries(groups)
    .filter(([, g]) => g.total > 0)
    .map(([mode, g]) => ({
      mode,
      label: SHORT_DECISION_LABELS[mode],
      pct: Math.round((g.helpful / g.total) * 100),
    }));

  if (data.length === 0) {
    return (
      <InsightCard>
        <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
          How you choose vs. what helps
        </p>
        <EmptyChartState label="Reflect on a few choices to see this." />
      </InsightCard>
    );
  }

  return (
    <InsightCard>
      <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
        How you choose vs. what helps
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: COLORS.inkFaint }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <YAxis hide domain={[0, 100]} />
          <Bar dataKey="pct" fill={COLORS.reflect} radius={[6, 6, 0, 0]} maxBarSize={44}>
            <LabelList dataKey="pct" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: COLORS.ink, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs" style={{ color: COLORS.inkFaint }}>
        Share of choices marked helpful, by how you made them.
      </p>
    </InsightCard>
  );
}

function ActivityTrend({ urges, choices }) {
  const all = [...urges.map((u) => u.startedAt), ...choices.map((c) => c.createdAt)];
  const byDay = {};
  all.forEach((iso) => {
    const key = new Date(iso).toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + 1;
  });
  const days = Object.keys(byDay).sort();
  const recentDays = days.slice(-14);
  const data = recentDays.map((key) => ({
    date: new Date(key).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: byDay[key],
  }));

  if (data.length === 0) {
    return (
      <InsightCard>
        <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
          Your activity over time
        </p>
        <EmptyChartState label="Log something to see this." />
      </InsightCard>
    );
  }

  return (
    <InsightCard>
      <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
        Your activity over time
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: COLORS.inkFaint }} axisLine={{ stroke: COLORS.border }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: COLORS.inkFaint }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${COLORS.border}` }}
            labelStyle={{ color: COLORS.ink }}
          />
          <Line type="monotone" dataKey="count" stroke={COLORS.reflect} strokeWidth={2} dot={{ r: 3, fill: COLORS.reflect }} />
        </LineChart>
      </ResponsiveContainer>
    </InsightCard>
  );
}

function ActionStatsChart({ urges, actions }) {
  const used = computeActionStats(urges, actions)
    .filter((a) => a.usageCount > 0)
    .map((a) => ({
      name: a.name,
      usageCount: a.usageCount,
      rate: Math.round(a.rate * 100),
    }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  if (used.length === 0) {
    return (
      <InsightCard>
        <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
          Try Instead actions
        </p>
        <EmptyChartState label="Use an action during Pause to see this." />
      </InsightCard>
    );
  }

  const chartHeight = Math.max(90, used.length * 34);

  return (
    <InsightCard>
      <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
        Try Instead actions
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={used} layout="vertical" margin={{ top: 4, right: 46, left: 0, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tick={{ fontSize: 10, fill: COLORS.inkSoft }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="usageCount" fill={COLORS.pause} radius={[0, 6, 6, 0]} maxBarSize={16}>
            <LabelList dataKey="rate" position="right" formatter={(v) => `${v}% helped`} style={{ fontSize: 10, fill: COLORS.inkFaint }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-xs" style={{ color: COLORS.inkFaint }}>
        Bar length shows how often you've used each action.
      </p>
    </InsightCard>
  );
}

function PatternTracker({ urges, actions }) {
  if (urges.length === 0) {
    return (
      <InsightCard>
        <p className="mb-1 text-sm font-medium" style={{ color: COLORS.ink }}>
          Patterns by urge
        </p>
        <p className="text-sm" style={{ color: COLORS.inkFaint }}>
          Pause on an urge to start seeing what tends to work for you.
        </p>
      </InsightCard>
    );
  }

  const patterns = computeUrgePatterns(urges, actions);

  return (
    <InsightCard>
      <p className="mb-1 text-sm font-medium" style={{ color: COLORS.ink }}>
        Patterns by urge
      </p>
      <p className="mb-3 text-xs" style={{ color: COLORS.inkFaint }}>
        What you tend to feel, how often, how it went, and what's worked instead.
      </p>
      <div className="flex flex-col gap-2.5">
        {patterns.map((p) => (
          <div key={p.type} className="rounded-xl px-3.5 py-3" style={{ border: `1px solid ${COLORS.border}` }}>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: COLORS.ink }}>
                {p.type}
              </p>
              <p className="text-xs" style={{ color: COLORS.inkFaint }}>
                {p.count}× logged
              </p>
            </div>
            <p className="mb-1.5 text-xs" style={{ color: COLORS.inkSoft }}>
              Redirected {p.redirected} · Acted on {p.acted} · Not sure {p.notSure}
            </p>
            <p className="text-xs" style={{ color: COLORS.inkFaint }}>
              {p.bestAction
                ? `Try instead: ${p.bestAction.name} — worked ${p.bestAction.worked} of ${p.bestAction.used} times`
                : "Not enough data yet to suggest what to try instead."}
            </p>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function InsightsScreen({ urges, choices, actions }) {
  const total = urges.length + choices.length;
  if (total === 0) {
    return (
      <div className="flex h-full flex-col pt-7">
        <p className="px-5 pb-4 text-xs tracking-wide" style={{ color: COLORS.inkFaint }}>
          Insights
        </p>
        <EmptyState label="Log a few urges or choices to see your patterns." />
      </div>
    );
  }

  const helpful = choices.filter((c) => c.outcome === "helpful").length;
  const redirected = urges.filter((u) => REDIRECTED_RESULTS.has(u.result)).length;

  const actionStats = computeActionStats(urges, actions);

  const bestAction = actionStats
    .filter((a) => a.usageCount >= 2)
    .sort((a, b) => (b.rate === a.rate ? b.usageCount - a.usageCount : b.rate - a.rate))[0];

  const urgeTypeCounts = (() => {
    const map = new Map();
    urges.forEach((u) => {
      const key = u.urgeType || "Other";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
  })();

  const redirectedEntries = urges
    .filter((u) => REDIRECTED_RESULTS.has(u.result))
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  const usedActionStats = actionStats
    .filter((a) => a.usageCount > 0)
    .map((a) => ({ ...a, rate: Math.round(a.rate * 100) }))
    .sort((a, b) => (b.rate === a.rate ? b.usageCount - a.usageCount : b.rate - a.rate));

  return (
    <div className="flex h-full flex-col overflow-y-auto pt-7">
      <p className="px-5 pb-4 text-xs tracking-wide" style={{ color: COLORS.inkFaint }}>
        Insights
      </p>
      <div className="flex flex-col gap-3 px-5 pb-6">
        <InsightCard>
          <p className="text-sm" style={{ color: COLORS.inkSoft }}>
            You've logged <strong style={{ color: COLORS.ink }}>{total}</strong> {total === 1 ? "entry" : "entries"} so far.
          </p>
          {urgeTypeCounts.length > 0 && (
            <MiniScrollBox>
              {urgeTypeCounts.map((u, i) => (
                <MiniScrollRow key={u.type} left={u.type} right={`${u.count}×`} isFirst={i === 0} />
              ))}
            </MiniScrollBox>
          )}
        </InsightCard>

        {urges.length > 0 && (
          <InsightCard>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              You redirected or reduced <strong style={{ color: COLORS.ink }}>{redirected}</strong> of {urges.length} urges.
            </p>
            {redirectedEntries.length > 0 && (
              <MiniScrollBox>
                {redirectedEntries.map((u, i) => (
                  <MiniScrollRow
                    key={u.id}
                    left={u.urgeType}
                    right={`${urgeResultShort(u.result)} · ${formatWhen(u.startedAt)}`}
                    isFirst={i === 0}
                  />
                ))}
              </MiniScrollBox>
            )}
          </InsightCard>
        )}

        {bestAction && (
          <InsightCard>
            <p className="text-sm" style={{ color: COLORS.inkSoft }}>
              <strong style={{ color: COLORS.ink }}>{bestAction.name}</strong> has helped you redirect{" "}
              <strong style={{ color: COLORS.ink }}>{bestAction.successCount}</strong> of {bestAction.usageCount} times you've used it.
            </p>
            {usedActionStats.length > 0 && (
              <MiniScrollBox>
                {usedActionStats.map((a, i) => (
                  <MiniScrollRow
                    key={a.id}
                    left={a.name}
                    right={`${a.successCount}/${a.usageCount} · ${a.rate}%`}
                    isFirst={i === 0}
                  />
                ))}
              </MiniScrollBox>
            )}
          </InsightCard>
        )}

        <PatternTracker urges={urges} actions={actions} />

        <OutcomeDoughnut choices={choices} />
        <ActionStatsChart urges={urges} actions={actions} />
        <DecisionModeChart choices={choices} />
        <ActivityTrend urges={urges} choices={choices} />
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
      urgeTypes: normalizeUrgeTypes(parsed.urgeTypes),
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
      const wasUseful = REDIRECTED_RESULTS.has(urgeRecord.result);
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

  const addUrgeType = (text) => {
    const maxSort = urgeTypes.reduce((m, u) => Math.max(m, u.sortOrder), -1);
    const newType = { id: uid(), text, sortOrder: maxSort + 1 };
    persist({ ...data, urgeTypes: [...urgeTypes, newType] });
  };

  const editUrgeType = (id, text) => {
    persist({ ...data, urgeTypes: urgeTypes.map((u) => (u.id === id ? { ...u, text } : u)) });
  };

  const deleteUrgeType = (id) => {
    persist({ ...data, urgeTypes: urgeTypes.filter((u) => u.id !== id) });
  };

  const moveUrgeType = (id, direction) => {
    const sorted = [...urgeTypes].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((u) => u.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[swapIndex];
    const updated = urgeTypes.map((u) => {
      if (u.id === a.id) return { ...u, sortOrder: b.sortOrder };
      if (u.id === b.id) return { ...u, sortOrder: a.sortOrder };
      return u;
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
        onAddUrgeType={addUrgeType}
        onEditUrgeType={editUrgeType}
        onDeleteUrgeType={deleteUrgeType}
        onMoveUrgeType={moveUrgeType}
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
