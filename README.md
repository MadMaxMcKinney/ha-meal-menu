# Meal Menu — Home Assistant custom panel

A simple breakfast/lunch/dinner menu board with a "pantry" of saved dishes.
Data is shared across every device and stored as JSON on the HA host — no extra
server, database, or port forwarding.

## What's in here

```
custom_components/meal_menu/__init__.py   # WebSocket get/save backed by Store
custom_components/meal_menu/manifest.json
www/meal-menu-panel.js                    # the panel UI (a web component)
```

## Install

1. Copy `custom_components/meal_menu/` into your HA config folder so you have
   `config/custom_components/meal_menu/__init__.py`.
2. Copy `www/meal-menu-panel.js` into `config/www/` (create `www` if needed).
   It will be served at `/local/meal-menu-panel.js`.
3. Add both blocks below to `configuration.yaml`.
4. Restart Home Assistant. "Meal Menu" appears in the sidebar.

```yaml
# Storage backend (registers the websocket commands)
meal_menu:

# Sidebar panel
panel_custom:
  - name: meal-menu-panel        # must match the custom element name
    sidebar_title: Meal Menu
    sidebar_icon: mdi:silverware-fork-knife
    url_path: meal-menu
    module_url: /local/meal-menu-panel.js?v=1
```

> When you edit `meal-menu-panel.js` later, bump the `?v=` number (e.g. `?v=2`).
> `/local/` files are cached hard by the browser, so without this you'll keep
> seeing the old version.

## How it behaves

- **Shared:** every phone, tablet, and browser reads/writes the same JSON file
  (`config/.storage/meal_menu`). Add a dish on the kitchen tablet, it's there on
  your phone after a reload.
- **Authenticated:** the panel runs inside HA behind its login, and the
  websocket commands require an authenticated session.
- **Works remotely:** because it's served on HA's own origin, it loads anywhere
  HA does — through Nabu Casa or your reverse proxy — with no mixed-content or
  extra-firewall issues. Nothing new is exposed to the internet.

## Notes / things to confirm against your HA version

These pieces use HA-internal conventions that occasionally shift between
releases. If something misbehaves, check these first:

- **Sidebar toggle button** (the hamburger in the panel's top bar) fires the
  `hass-toggle-menu` event. If it doesn't toggle the sidebar on your version,
  it's harmless — you can still open the sidebar normally — or remove that
  button. Everything else works without it.
- **Static path registration** is handled for you by `panel_custom` +
  `/local/`, so there's no custom `register_static_path` call to break.

## Possible next steps

- **Follow HA dark mode:** the panel uses a fixed warm "menu paper" palette.
  Swap the hex values in `:host` for HA theme variables
  (`--primary-background-color`, `--card-background-color`,
  `--primary-text-color`, `--divider-color`) to track light/dark themes.
- **Live sync across open devices:** right now other devices pick up changes on
  reload. Add a `meal_menu/subscribe` websocket command that fires on save, and
  have the panel re-render on the event, for instant cross-device updates.
- **Move config into the UI:** convert from YAML setup to a config entry so it
  installs from Settings → Devices & Services instead of `configuration.yaml`.
