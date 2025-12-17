import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./SlidePanel.scss";

export default function SlidePanel({
  open,
  onClose,
  title,
  width = "420px",
  closeOnOverlayClick = true,
  children,
  id = "slide-panel",
}) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape" && open) {
        onClose && onClose();
      }
      if (e.key === "Tab" && open && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    if (open) {
      previouslyFocused.current = document.activeElement;
      setTimeout(() => {
        if (panelRef.current) {
          const firstFocusable = panelRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          (firstFocusable || panelRef.current).focus();
        }
      }, 50);
      window.addEventListener("keydown", handleKey);
    }

    return () => {
      window.removeEventListener("keydown", handleKey);
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  function handleOverlayClick(e) {
    if (!closeOnOverlayClick) return;
    if (e.target === overlayRef.current) {
      onClose && onClose();
    }
  }

  return (
    <>
      <div
        ref={overlayRef}
        className={`sp-overlay ${open ? "open" : ""}`}
        onMouseDown={handleOverlayClick}
        aria-hidden={!open}
      />
      <aside
        id={id}
        ref={panelRef}
        className={`sp-panel ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        style={{ width }}
      >
        <div className="sp-header">
          {title ? (
            <h3 id={`${id}-title`} className="sp-title">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <div className="sp-actions">
            <button
              type="button"
              className="sp-close"
              onClick={() => onClose && onClose()}
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="sp-body" tabIndex={-1}>
          {children}
        </div>
      </aside>
    </>
  );
}

SlidePanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  width: PropTypes.string,
  closeOnOverlayClick: PropTypes.bool,
  children: PropTypes.node,
  id: PropTypes.string,
};
