import React, { useState, useRef, useEffect, useCallback } from "react";
import { DEGREE_CATALOG, DEGREE_CATEGORIES } from "./examData.js";

/**
 * DegreeSelect
 * Searchable, grouped, keyboard-navigable degree picker.
 * Replaces the two-step Stream → Degree flow with a single field.
 *
 * Props:
 *   id        – input id (for label association)
 *   value     – currently selected degree VALUE (e.g. "btech")
 *   onChange  – called with the selected degree object: { value, label, category }
 *   required  – HTML required attribute
 */
export default function DegreeSelect({ id, value, onChange, required }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Resolve current label from value
  const selectedEntry = DEGREE_CATALOG.find((d) => d.value === value) || null;
  const displayValue = open ? query : (selectedEntry ? selectedEntry.label : "");

  // Build filtered + grouped list
  const filteredEntries = query.trim().length === 0
    ? DEGREE_CATALOG
    : DEGREE_CATALOG.filter(
        (d) =>
          d.label.toLowerCase().includes(query.toLowerCase()) ||
          d.category.toLowerCase().includes(query.toLowerCase())
      );

  // Build flat list with group headers interleaved (for keyboard nav over real items only)
  const flatItems = filteredEntries; // keyboard nav indexes over degree entries

  // Group for rendering
  const grouped = DEGREE_CATEGORIES.reduce((acc, cat) => {
    const items = filteredEntries.filter((d) => d.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  // Keep highlighted in bounds when filter changes
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlighted}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!open) setQuery("");
  }, [value, open]);

  function handleSelect(entry) {
    onChange(entry);
    setOpen(false);
    setQuery("");
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    setOpen(true);
  }

  function handleInputFocus() {
    setQuery("");
    setOpen(true);
  }

  function handleKeyDown(e) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[highlighted]) handleSelect(flatItems[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = Object.keys(grouped).length > 0;

  // Build a flat-index → entry map for keyboard nav
  let flatIdx = 0;
  const renderGroups = Object.entries(grouped).map(([cat, entries]) => ({
    cat,
    entries: entries.map((entry) => ({ entry, idx: flatIdx++ })),
  }));

  return (
    <div className={`degree-select-container ${open ? "open" : ""}`} ref={containerRef}>
      {/* Trigger / search input */}
      <div
        className={`degree-select-trigger ${open ? "open" : ""} ${selectedEntry && !open ? "has-value" : ""}`}
        onClick={() => { setOpen((v) => !v); if (!open) inputRef.current?.focus(); }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
      >
        <input
          ref={inputRef}
          id={id}
          className="degree-select-search"
          type="text"
          placeholder={selectedEntry ? selectedEntry.label : "Search degree or category…"}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          required={required && !value}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
        />
        {selectedEntry && !open && (
          <span className="degree-select-category-badge">{selectedEntry.category}</span>
        )}
        <span className={`degree-select-chevron ${open ? "open" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id={`${id}-listbox`}
          className="degree-select-dropdown"
          role="listbox"
          ref={listRef}
        >
          {!hasResults ? (
            <div className="degree-select-empty">No degrees found for "{query}"</div>
          ) : (
            renderGroups.map(({ cat, entries }) => (
              <div key={cat} className="degree-select-group">
                <div className="degree-select-group-header">{cat}</div>
                {entries.map(({ entry, idx }) => (
                  <div
                    key={entry.value}
                    data-idx={idx}
                    className={`degree-select-option ${idx === highlighted ? "highlighted" : ""} ${entry.value === value ? "selected" : ""}`}
                    role="option"
                    aria-selected={entry.value === value}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(entry); }}
                    onMouseEnter={() => setHighlighted(idx)}
                  >
                    {entry.label}
                    {entry.value === value && (
                      <svg className="degree-select-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
