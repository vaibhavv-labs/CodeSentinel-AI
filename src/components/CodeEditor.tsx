"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

// ─── Tiny syntax highlighter (no runtime dep) ─────────────────────────────────
// Extend token rules per language as needed.

type TokenType =
  | "keyword"
  | "builtin"
  | "string"
  | "comment"
  | "number"
  | "operator"
  | "punctuation"
  | "plain";

interface Token {
  type: TokenType;
  value: string;
}

const PYTHON_KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class",
  "continue","def","del","elif","else","except","finally","for","from",
  "global","if","import","in","is","lambda","nonlocal","not","or","pass",
  "raise","return","try","while","with","yield",
]);

const PYTHON_BUILTINS = new Set([
  "print","len","range","int","str","float","list","dict","set","tuple",
  "bool","type","input","open","enumerate","zip","map","filter","sorted",
  "reversed","sum","min","max","abs","round","isinstance","issubclass",
  "hasattr","getattr","setattr","super","property","staticmethod","classmethod",
]);

function tokenizePython(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    // Comment
    if (line[i] === "#") {
      tokens.push({ type: "comment", value: line.slice(i) });
      break;
    }

    // String (triple then single)
    if (
      (line[i] === '"' || line[i] === "'") &&
      line.slice(i, i + 3) === line[i].repeat(3)
    ) {
      const q = line[i].repeat(3);
      const end = line.indexOf(q, i + 3);
      const v = end === -1 ? line.slice(i) : line.slice(i, end + 3);
      tokens.push({ type: "string", value: v });
      i += v.length;
      continue;
    }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      let j = i + 1;
      while (j < n && line[j] !== q) {
        if (line[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Number
    if (/[0-9]/.test(line[i]) || (line[i] === "." && /[0-9]/.test(line[i + 1] ?? ""))) {
      let j = i;
      while (j < n && /[0-9._xXbBoOeE]/.test(line[j])) j++;
      tokens.push({ type: "number", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Identifier / keyword / builtin
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const type: TokenType = PYTHON_KEYWORDS.has(word)
        ? "keyword"
        : PYTHON_BUILTINS.has(word)
        ? "builtin"
        : "plain";
      tokens.push({ type, value: word });
      i = j;
      continue;
    }

    // Operator
    if (/[+\-*/%=<>!&|^~@]/.test(line[i])) {
      let j = i;
      while (j < n && /[+\-*/%=<>!&|^~@]/.test(line[j])) j++;
      tokens.push({ type: "operator", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Punctuation
    if (/[()[\]{},.:;]/.test(line[i])) {
      tokens.push({ type: "punctuation", value: line[i] });
      i++;
      continue;
    }

    // Whitespace / anything else
    let j = i;
    while (
      j < n &&
      !/[a-zA-Z0-9_"'#()\[\]{},.:;+\-*/%=<>!&|^~@ \t]/.test(line[j])
    )
      j++;
    if (j === i) j++;
    tokens.push({ type: "plain", value: line.slice(i, j) });
    i = j;
  }

  return tokens;
}

const TOKEN_CLASSES: Record<TokenType, string> = {
  keyword:     "text-[#c792ea]",
  builtin:     "text-[#82aaff]",
  string:      "text-[#c3e88d]",
  comment:     "text-[#546e7a] italic",
  number:      "text-[#f78c6c]",
  operator:    "text-[#89ddff]",
  punctuation: "text-[#89ddff]",
  plain:       "text-[#d4d4d4]",
};

function HighlightedCode({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {line === "" ? (
            <span className="text-transparent select-none">{"​"}</span>
          ) : (
            tokenizePython(line).map((tok, ti) => (
              <span key={ti} className={TOKEN_CLASSES[tok.type]}>
                {tok.value}
              </span>
            ))
          )}
          {li < lines.length - 1 && "\n"}
        </React.Fragment>
      ))}
    </>
  );
}

// ─── Line numbers ─────────────────────────────────────────────────────────────

function LineNumbers({
  count,
  scrollTop,
}: {
  count: number;
  scrollTop: number;
}) {
  return (
    <div
      className="select-none pointer-events-none shrink-0 w-10 text-right pr-3 font-mono text-xs leading-relaxed text-[#3d4a5a] overflow-hidden"
      style={{ paddingTop: 24, transform: `translateY(-${scrollTop}px)` }}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="leading-[1.625rem]">
          {i + 1}
        </div>
      ))}
    </div>
  );
}

// ─── useIsMobile ──────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── Desktop editor (textarea + overlay) ─────────────────────────────────────

function DesktopEditor({
  value,
  onChange,
  placeholder,
  minHeight,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  // Keep textarea and pre scroll in sync
  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pre = preRef.current;
    if (!ta || !pre) return;
    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
    setScrollTop(ta.scrollTop);
  }, []);

  // Tab key support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = value.substring(0, start) + "    " + value.substring(end);
        onChange(next);
        // Restore cursor after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 4;
        });
      }
    },
    [value, onChange]
  );

  return (
    <div
      ref={containerRef}
      className="flex w-full"
      style={{ minHeight, fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}
    >
      {/* Line numbers */}
      <LineNumbers count={lineCount} scrollTop={scrollTop} />

      {/* Editor area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Syntax-highlighted overlay — pointer-events:none, exact scroll mirror */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className="
            absolute inset-0 m-0 p-0 pt-6 pr-6 pb-6
            font-mono text-sm leading-relaxed
            pointer-events-none
            overflow-auto
            whitespace-pre
            text-[#d4d4d4]
            bg-transparent
          "
          style={{
            // Hide scrollbars on the pre — the textarea's scrollbars are canonical
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <code>
            <HighlightedCode code={value} />
            {/* Trailing newline keeps overlay same height as textarea */}
            {"\n"}
          </code>
        </pre>

        {/* Transparent textarea — the real input surface */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="
            relative z-10
            w-full h-full
            min-h-full
            m-0 pt-6 pr-6 pb-6 pl-0
            font-mono text-sm leading-relaxed
            bg-transparent
            text-transparent
            caret-[#89ddff]
            resize-none
            outline-none
            overflow-auto
            whitespace-pre
            placeholder:text-[#3d4a5a]
          "
          style={{
            minHeight,
            caretColor: "#89ddff",
            // Ensure textarea is at least as tall as content
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}

// ─── Mobile editor (contenteditable — no overlay hell) ────────────────────────
// On mobile, contenteditable gives us native text selection, copy/paste,
// autocorrect control, and smooth scrolling for free.

function MobileEditor({
  value,
  onChange,
  placeholder,
  minHeight,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight: number;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const lastValue = useRef(value);
  const [scrollTop, setScrollTop] = useState(0);
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  // Render highlighted HTML into contenteditable
  // We must do this carefully to not disturb the caret.
  useEffect(() => {
    const el = divRef.current;
    if (!el || isComposing.current) return;
    if (lastValue.current === value) return; // no external change

    // Save / restore selection
    const sel = window.getSelection();
    let savedRange: Range | null = null;
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }

    // Rebuild highlighted HTML
    const lines = value.split("\n");
    const html = lines
      .map((line) => {
        if (line === "") return '<span class="ce-line">&#8203;</span>';
        const tokens = tokenizePython(line);
        const inner = tokens
          .map(
            (t) =>
              `<span class="${TOKEN_CLASSES[t.type]}">${escapeHtml(t.value)}</span>`
          )
          .join("");
        return `<span class="ce-line">${inner}</span>`;
      })
      .join("\n");

    el.innerHTML = html;
    lastValue.current = value;

    // Restore cursor to end if we had no saved range
    if (savedRange && sel) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      } catch {
        // range may be stale — move to end
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
  }, [value]);

  // Initial render
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const lines = value.split("\n");
    el.innerHTML = lines
      .map((line) => {
        if (line === "") return '<span class="ce-line">&#8203;</span>';
        const tokens = tokenizePython(line);
        const inner = tokens
          .map(
            (t) =>
              `<span class="${TOKEN_CLASSES[t.type]}">${escapeHtml(t.value)}</span>`
          )
          .join("");
        return `<span class="ce-line">${inner}</span>`;
      })
      .join("\n");
    lastValue.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const el = divRef.current;
    if (!el) return;
    const text = el.innerText
      // Normalize line endings that browsers insert
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
    lastValue.current = text;
    onChange(text);
  }, [onChange]);

  return (
    <div
      className="flex w-full"
      style={{
        minHeight,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      }}
    >
      {/* Line numbers */}
      <LineNumbers count={lineCount} scrollTop={scrollTop} />

      {/* Scrollable wrapper */}
      <div
        className="flex-1 overflow-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
        onScroll={(e) => setScrollTop((e.target as HTMLElement).scrollTop)}
      >
        {/* contenteditable div */}
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          autoCorrect="off"
          // @ts-ignore — non-standard but supported
          autoCapitalize="off"
          data-placeholder={placeholder}
          onInput={handleInput}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => {
            isComposing.current = false;
            handleInput();
          }}
          className="
            relative
            outline-none
            font-mono text-sm leading-relaxed
            text-[#d4d4d4]
            whitespace-pre
            p-6 pt-6
            min-w-max
            caret-[#89ddff]
            empty:before:content-[attr(data-placeholder)]
            empty:before:text-[#3d4a5a]
            empty:before:pointer-events-none
          "
          style={{
            caretColor: "#89ddff",
            minHeight,
            // Prevent iOS from zooming on focus
            fontSize: "0.875rem",
            touchAction: "pan-x pan-y",
          }}
        />
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Public component ─────────────────────────────────────────────────────────

export function CodeEditor({
  value,
  onChange,
  language = "python",
  placeholder = "# Start typing your code...",
  minHeight = 340,
  className = "",
}: CodeEditorProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={`
        relative w-full overflow-hidden
        bg-[#0d1117] rounded-xl
        border border-[#1e2d3d]
        shadow-[0_0_0_1px_rgba(137,221,255,0.04),0_8px_32px_rgba(0,0,0,0.4)]
        ${className}
      `}
    >
      {/* Scrollable container — single scroll region */}
      <div
        className="overflow-auto"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          maxHeight: "70vh",
        }}
      >
        {isMobile ? (
          <MobileEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            minHeight={minHeight}
          />
        ) : (
          <DesktopEditor
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            minHeight={minHeight}
          />
        )}
      </div>
    </div>
  );
}

export default CodeEditor;
