// Meal Menu — Home Assistant custom panel.
// Registered programmatically by the `meal_menu` integration via
// panel_custom.async_register_panel (see __init__.py). HA loads this module and
// sets `.hass` on the element; we read/write the menu over the WebSocket
// commands provided by the integration.

// Meal types with theme-aware colors using Home Assistant color variables
const MEALS = [
    { key: "breakfast", label: "Breakfast", icon: "mdi:weather-sunset-up", dotVar: "--amber-color", dotFallback: "#C98A2B", def: "mdi:egg-fried" },
    { key: "lunch", label: "Lunch", icon: "mdi:white-balance-sunny", dotVar: "--green-color", dotFallback: "#6E8F5E", def: "mdi:food-apple" },
    { key: "dinner", label: "Dinner", icon: "mdi:weather-night", dotVar: "--deep-purple-color", dotFallback: "#5B5B8A", def: "mdi:silverware-fork-knife" },
];

const ICONS = [
    "mdi:egg-fried",
    "mdi:bread-slice",
    "mdi:food-croissant",
    "mdi:coffee",
    "mdi:cup",
    "mdi:food-apple",
    "mdi:bowl-mix",
    "mdi:hamburger",
    "mdi:pizza",
    "mdi:taco",
    "mdi:noodles",
    "mdi:pasta",
    "mdi:rice",
    "mdi:pot-steam",
    "mdi:food-drumstick",
    "mdi:fish",
    "mdi:cupcake",
    "mdi:carrot",
    "mdi:cheese",
    "mdi:fruit-cherries",
    "mdi:silverware-fork-knife",
];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

class MealMenuPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._entries = [];
        this._drafts = { breakfast: "", lunch: "", dinner: "" };
        this._draftIcon = { breakfast: "mdi:egg-fried", lunch: "mdi:food-apple", dinner: "mdi:silverware-fork-knife" };
        this._openPalette = null;
        this._confirmId = null;
        this._loaded = false;
        // Delegated listeners survive full re-renders (the shadow root persists).
        this.shadowRoot.addEventListener("click", (e) => this._onClick(e));
        this.shadowRoot.addEventListener("input", (e) => this._onInput(e));
        this.shadowRoot.addEventListener("keydown", (e) => this._onKeydown(e));
    }

    // HA assigns the hass object here, repeatedly. We only load once.
    set hass(hass) {
        this._hass = hass;
        if (!this._loaded) {
            this._loaded = true;
            this._load();
        }
    }

    connectedCallback() {
        if (!this._entries.length && !this._rendered) {
            this.shadowRoot.innerHTML = `<style>${CSS}</style><div class="loading">Loading menu…</div>`;
        }
    }

    async _load() {
        try {
            const res = await this._hass.connection.sendMessagePromise({ type: "meal_menu/get" });
            this._entries = (res && res.entries) || [];
            this._error = null;
        } catch (e) {
            this._entries = [];
            this._error = "Couldn't load the menu. Try reloading the page.";
        }
        this._render();
    }

    async _persist() {
        try {
            await this._hass.connection.sendMessagePromise({ type: "meal_menu/save", entries: this._entries });
        } catch (e) {
            this._error = "Couldn't save your change. It may not stick after a reload.";
            this._render();
        }
    }

    // --- mutations: update locally (snappy), re-render, then persist ---
    _add(meal) {
        const title = (this._drafts[meal] || "").trim();
        if (!title) return;
        this._entries.push({ id: uid(), title, icon: this._draftIcon[meal] || "mdi:silverware-fork-knife", meal, location: "pantry" });
        this._drafts[meal] = "";
        this._render();
        this._persist();
    }
    _remove(id) {
        this._entries = this._entries.filter((x) => x.id !== id);
        this._confirmId = null;
        this._render();
        this._persist();
    }
    _move(id, location) {
        this._entries = this._entries.map((x) => (x.id === id ? { ...x, location } : x));
        this._render();
        this._persist();
    }

    _onClick(e) {
        const el = e.target.closest("[data-action]");
        if (!el) return;
        const { action, id, meal, icon } = el.dataset;
        if (action === "menu") {
            // Toggle the HA sidebar (handy on mobile). See note in the README.
            this.dispatchEvent(new CustomEvent("hass-toggle-menu", { bubbles: true, composed: true }));
        } else if (action === "toggle-palette") {
            this._openPalette = this._openPalette === meal ? null : meal;
            this._render();
        } else if (action === "pick-icon") {
            this._draftIcon[meal] = icon;
            this._openPalette = null;
            this._render();
        } else if (action === "add") {
            this._add(meal);
        } else if (action === "promote") {
            this._move(id, "active");
        } else if (action === "demote") {
            this._move(id, "pantry");
        } else if (action === "ask-remove") {
            this._confirmId = id;
            this._render();
        } else if (action === "keep") {
            this._confirmId = null;
            this._render();
        } else if (action === "remove") {
            this._remove(id);
        }
    }

    // Don't re-render on typing — that would drop focus. Just track the value.
    _onInput(e) {
        const input = e.target.closest("input[data-meal]");
        if (input) this._drafts[input.dataset.meal] = input.value;
    }
    _onKeydown(e) {
        const input = e.target.closest("input[data-meal]");
        if (input && e.key === "Enter") this._add(input.dataset.meal);
    }

    _slot(location, meal) {
        return this._entries.filter((x) => x.location === location && x.meal === meal);
    }

    _dish(it, mode) {
        const confirming = this._confirmId === it.id;
        const tile = `<span class="dish-icon"><ha-icon icon="${esc(it.icon)}"></ha-icon></span>`;
        if (confirming) {
            return `<div class="dish${mode === "pantry" ? " pantry-dish" : ""} confirming">
        ${tile}
        <span class="dish-title confirm-text">Remove?</span>
        <button class="confirmbtn keep" data-action="keep">Keep</button>
        <button class="confirmbtn del" data-action="remove" data-id="${it.id}">Delete</button>
      </div>`;
        }
        const move =
            mode === "pantry"
                ? `<button class="iconbtn promote" data-action="promote" data-id="${it.id}" title="Add to menu"><ha-icon icon="mdi:arrow-up"></ha-icon></button>`
                : `<button class="iconbtn" data-action="demote" data-id="${it.id}" title="Return to pantry"><ha-icon icon="mdi:arrow-down"></ha-icon></button>`;
        return `<div class="dish${mode === "pantry" ? " pantry-dish" : ""}">
      ${tile}
      <span class="dish-title">${esc(it.title)}</span>
      ${move}
      <button class="iconbtn danger" data-action="ask-remove" data-id="${it.id}" title="Remove"><ha-icon icon="mdi:close"></ha-icon></button>
    </div>`;
    }

    _render() {
        this._rendered = true;
        const activeCount = this._entries.filter((x) => x.location === "active").length;

        const board = MEALS.map(({ key, label, icon, dotVar, dotFallback }) => {
            const items = this._slot("active", key);
            const dishes = items.length ? items.map((it) => this._dish(it, "active")).join("") : `<p class="empty">Nothing planned.</p>`;
            // Use CSS variable for theme support, with fallback color
            const dotStyle = `background: var(${dotVar}, ${dotFallback})`;
            return `<div class="course">
        <div class="course-head">
          <span class="course-dot" style="${dotStyle}"></span>
          <ha-icon class="course-icon" icon="${icon}"></ha-icon>
          <span class="course-label">${label}</span>
          <span class="course-count">${items.length}</span>
        </div>
        <div class="dishes">${dishes}</div>
      </div>`;
        }).join("");

        const pantry = MEALS.map(({ key, label, dotVar, dotFallback }) => {
            const items = this._slot("pantry", key);
            const palette =
                this._openPalette === key
                    ? `<div class="palette">${ICONS.map(
                          (ic) => `<button class="palette-emoji" data-action="pick-icon" data-meal="${key}" data-icon="${ic}" title="${ic}"><ha-icon icon="${ic}"></ha-icon></button>`,
                      ).join("")}</div>`
                    : "";
            // Use CSS variable for theme support, with fallback color
            const dotStyle = `background: var(${dotVar}, ${dotFallback})`;
            return `<div class="shelf">
        <div class="shelf-head">
          <span class="course-dot" style="${dotStyle}"></span>
          <span class="shelf-label">${label}</span>
        </div>
        <div class="composer">
          <button class="emoji-pick" data-action="toggle-palette" data-meal="${key}" title="Choose an icon"><ha-icon icon="${esc(this._draftIcon[key])}"></ha-icon></button>
          <input class="composer-input" data-meal="${key}" placeholder="Add a dish…" value="${esc(this._drafts[key] || "")}" aria-label="Add a ${label} dish" />
          <button class="addbtn" data-action="add" data-meal="${key}" title="Add to pantry"><ha-icon icon="mdi:plus"></ha-icon></button>
          ${palette}
        </div>
        <div class="dishes pantry-dishes">${items.map((it) => this._dish(it, "pantry")).join("")}</div>
      </div>`;
        }).join("");

        this.shadowRoot.innerHTML = `<style>${CSS}</style>
      <div class="wrap">
        ${this._error ? `<div class="banner">${esc(this._error)}</div>` : ""}
        <header class="masthead">
          <div>
            <h1>Menu</h1>
            <p class="masthead-sub">${activeCount === 0 ? "Nothing planned yet" : `${activeCount} dishes on the board`}</p>
          </div>
        </header>
        <section class="board">${board}</section>
        <div class="rule rule-label"><span>Pantry</span></div>
        <section class="pantry">${pantry}</section>
      </div>`;
    }
}

customElements.define("meal-menu-panel", MealMenuPanel);

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

/*
 * Meal Menu Theme Integration
 *
 * This panel uses Home Assistant theme variables for automatic
 * light/dark mode support and full theme compatibility.
 *
 * Internal Variable Names:
 * - meal-menu-background: Main page background
 * - meal-menu-card-background: Card/container backgrounds
 * - meal-menu-text-primary: Primary text color
 * - meal-menu-text-secondary: Secondary/muted text
 * - meal-menu-accent: Primary accent color (buttons, links)
 * - meal-menu-accent-light: Light variant of accent
 * - meal-menu-secondary-accent: Secondary accent color
 * - meal-menu-divider: Borders and dividers
 *
 * Fallback values preserve the original warm "menu paper" aesthetic
 * when HA theme variables are unavailable.
 */

:host {
  /* Descriptive internal variables mapped to HA theme system */
  --meal-menu-background: var(--primary-background-color, #FBF6EC);
  --meal-menu-card-background: var(--card-background-color, #FFFFFF);
  --meal-menu-text-primary: var(--primary-text-color, #2B2620);
  --meal-menu-text-secondary: var(--secondary-text-color, #8A7F70);
  --meal-menu-accent: var(--primary-color, #46663E);
  --meal-menu-accent-light: var(--light-primary-color, #6E8F5E);
  --meal-menu-secondary-accent: var(--accent-color, #C98A2B);
  --meal-menu-divider: var(--divider-color, #E3D9C6);

  /* State colors using HA patterns */
  --meal-menu-error: var(--error-color, #B4452F);
  --meal-menu-text-on-accent: var(--text-accent-color, #FFFFFF);
  --meal-menu-text-disabled: var(--disabled-text-color, #B6AB99);

  display: block; min-height: 100vh; background: var(--meal-menu-background);
  color: var(--meal-menu-text-primary); font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
* { box-sizing: border-box; }
ha-icon { --mdc-icon-size: 18px; display: inline-flex; }

.loading { padding: 40px; color: var(--meal-menu-text-secondary); font-family: 'Inter', sans-serif; }
.wrap { padding: 56px clamp(16px, 4vw, 40px) 48px; max-width: 1100px; margin: 0 auto; }

.topbar {
  display: flex; align-items: center; gap: 6px;
  padding: 16px 10px; border-bottom: 1px solid var(--meal-menu-divider); background: var(--meal-menu-card-background);
}
.topbar-title { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 15px; }
.menu-btn {
  width: 38px; height: 38px; border: none; background: none; cursor: pointer;
  color: var(--meal-menu-text-secondary); border-radius: 8px; display: grid; place-items: center;
}
.menu-btn:hover { background: rgba(var(--rgb-primary-text-color, 43,38,32), 0.06); color: var(--meal-menu-text-primary); }

.banner {
  background: rgba(var(--rgb-error-color, 219,68,55), 0.08);
  border: 1px solid var(--meal-menu-error);
  color: var(--meal-menu-error);
  border-radius: 10px; padding: 9px 12px; font-size: 13px; margin-bottom: 16px;
}

.masthead { display: flex; align-items: center; gap: 14px; padding-bottom: 32px; }
.masthead-mark {
  width: 40px; height: 40px; flex: none; display: grid; place-items: center;
  border: 1.5px solid var(--meal-menu-accent); border-radius: 50%; color: var(--meal-menu-accent);
}
.masthead-mark ha-icon { --mdc-icon-size: 20px; }
.masthead h1 { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: clamp(26px, 4.4vw, 34px); letter-spacing: -0.01em; margin: 0; line-height: 1; }
.masthead-sub { margin: 5px 0 0; font-size: 13px; color: var(--meal-menu-text-secondary); }

.rule { margin: 16px 0 22px; }
.rule-double { height: 4px; border-top: 1.5px solid var(--meal-menu-text-primary); border-bottom: 1px solid var(--meal-menu-text-primary); }
.rule-label { display: flex; align-items: center; gap: 14px; margin: 34px 0 18px; }
.rule-label::before, .rule-label::after { content: ""; height: 1px; background: var(--meal-menu-divider); flex: 1; }
.rule-label span { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 15px; letter-spacing: 0.04em; }

.board, .pantry { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 720px) { .board, .pantry { grid-template-columns: 1fr; gap: 12px; } }

.course-head, .shelf-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.course-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.course-icon { color: var(--meal-menu-text-secondary); --mdc-icon-size: 16px; }
.course-label, .shelf-label { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 16px; }
.course-count { margin-left: auto; font-size: 11px; font-weight: 600; color: var(--meal-menu-text-secondary); background: rgba(var(--rgb-primary-color, 70,102,62), 0.08); border-radius: 20px; padding: 2px 8px; }

.dishes { display: flex; flex-direction: column; gap: 7px; }
.dish { display: flex; align-items: center; gap: 10px; background: var(--meal-menu-card-background); border: 1px solid var(--meal-menu-divider); border-radius: 11px; padding: 9px 9px 9px 11px; }
.dish-icon { width: 26px; height: 26px; flex: none; display: grid; place-items: center; color: var(--meal-menu-accent); }
.dish-title { flex: 1; font-size: 14px; font-weight: 500; line-height: 1.25; overflow-wrap: anywhere; }
.empty { margin: 0; font-size: 12.5px; color: var(--meal-menu-text-secondary); line-height: 1.4; font-style: italic; padding: 4px 2px; }
.pantry-dish { background: transparent; border-style: dashed; border-color: var(--meal-menu-divider); }
.pantry-dish .dish-icon { color: var(--meal-menu-text-secondary); }
.pantry-dishes { margin-top: 10px; }

.iconbtn { width: 28px; height: 28px; flex: none; border: none; cursor: pointer; border-radius: 8px; display: grid; place-items: center; background: rgba(var(--rgb-primary-text-color, 43,38,32), 0.05); color: var(--meal-menu-text-secondary); }
.iconbtn ha-icon { --mdc-icon-size: 16px; }
.iconbtn:hover { background: rgba(var(--rgb-primary-text-color, 43,38,32), 0.1); color: var(--meal-menu-text-primary); }
.iconbtn.promote { background: rgba(var(--rgb-primary-color, 70,102,62), 0.12); color: var(--meal-menu-accent); }
.iconbtn.promote:hover { background: var(--meal-menu-accent); color: var(--meal-menu-text-on-accent); }
.iconbtn.danger:hover { background: var(--meal-menu-error); color: var(--meal-menu-text-on-accent); }

.dish.confirming { border-color: var(--meal-menu-error); border-style: solid; background: rgba(var(--rgb-error-color, 219,68,55), 0.08); }
.confirm-text { color: var(--meal-menu-error); font-style: italic; font-weight: 500; }
.confirmbtn { height: 28px; padding: 0 11px; flex: none; cursor: pointer; border: none; border-radius: 8px; font-family: inherit; font-size: 12.5px; font-weight: 600; }
.confirmbtn.keep { background: rgba(var(--rgb-primary-text-color, 43,38,32), 0.06); color: var(--meal-menu-text-secondary); }
.confirmbtn.keep:hover { background: rgba(var(--rgb-primary-text-color, 43,38,32), 0.12); color: var(--meal-menu-text-primary); }
.confirmbtn.del { background: var(--meal-menu-error); color: var(--meal-menu-text-on-accent); }
.confirmbtn.del:hover { background: var(--red-color, #963A28); }

.composer { position: relative; display: flex; align-items: center; gap: 6px; }
.emoji-pick { width: 38px; height: 38px; flex: none; cursor: pointer; border: 1px solid var(--meal-menu-divider); background: var(--meal-menu-card-background); border-radius: 10px; display: grid; place-items: center; color: var(--meal-menu-accent); }
.emoji-pick:hover { border-color: var(--meal-menu-accent-light); }
.composer-input { flex: 1; min-width: 0; height: 38px; border: 1px solid var(--meal-menu-divider); background: var(--meal-menu-card-background); border-radius: 10px; padding: 0 12px; font-size: 14px; font-family: inherit; color: var(--meal-menu-text-primary); outline: none; }
.composer-input::placeholder { color: var(--meal-menu-text-disabled); }
.composer-input:focus { border-color: var(--meal-menu-accent-light); box-shadow: 0 0 0 3px rgba(var(--rgb-primary-color, 110,143,94), 0.15); }
.addbtn { width: 38px; height: 38px; flex: none; cursor: pointer; border: none; border-radius: 10px; display: grid; place-items: center; background: var(--meal-menu-accent); color: var(--meal-menu-text-on-accent); }
.addbtn:hover { background: var(--dark-primary-color, #38522F); }
.addbtn ha-icon { color: var(--meal-menu-text-on-accent); }

.palette { position: absolute; z-index: 20; top: 44px; left: 0; display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; background: var(--meal-menu-card-background); border: 1px solid var(--meal-menu-divider); border-radius: 12px; padding: 7px; box-shadow: var(--ha-card-box-shadow, 0 12px 28px rgba(43,38,32,0.16)); }
.palette-emoji { width: 34px; height: 34px; border: none; background: none; cursor: pointer; border-radius: 8px; color: var(--meal-menu-text-primary); display: grid; place-items: center; }
.palette-emoji:hover { background: rgba(var(--rgb-primary-color, 70,102,62), 0.1); }

button:focus-visible, input:focus-visible { outline: 2px solid var(--meal-menu-accent); outline-offset: 2px; }
`;
