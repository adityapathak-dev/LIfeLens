import React, { useState, useRef, useEffect } from "react";
import { COUNTRIES } from "./countries.js";

export default function CountrySelect({ id, value, onChange, placeholder = "Search country...", required }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = query.trim().length < 1
    ? COUNTRIES.slice(0, 20)
    : COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 30);

  // Sync external value in
  useEffect(() => {
    if (value !== query) setQuery(value || "");
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(country) {
    setQuery(country);
    onChange(country);
    setOpen(false);
  }

  function handleInputChange(e) {
    setQuery(e.target.value);
    setOpen(true);
    setHighlighted(0);
    // If cleared, propagate empty
    if (!e.target.value) onChange("");
  }

  function handleKeyDown(e) {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]); }
    else if (e.key === "Escape") setOpen(false);
  }

  // Click outside closes
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // If typed text doesn't match any country exactly, revert to last valid value
        if (!COUNTRIES.includes(query)) { setQuery(value || ""); }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, value]);

  return (
    <div className={`country-select-container ${open ? "open" : ""}`} ref={containerRef}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        className="country-select-input"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        required={required}
      />
      {open && filtered.length > 0 && (
        <ul className="country-select-dropdown" role="listbox">
          {filtered.map((country, i) => (
            <li
              key={country}
              role="option"
              aria-selected={i === highlighted}
              className={`country-select-option ${i === highlighted ? "highlighted" : ""} ${country === value ? "selected" : ""}`}
              onMouseDown={() => handleSelect(country)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
