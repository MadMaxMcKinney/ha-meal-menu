# Meal Menu — Home Assistant custom panel

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/maxga/ha-meal-menu.svg)](https://github.com/maxga/ha-meal-menu/releases)

A simple breakfast/lunch/dinner menu board with a "pantry" of saved dishes.
Data is shared across every device and stored as JSON on the HA host — no extra
server, database, or port forwarding.

**Features:**
- 🎨 Full Home Assistant theme support (automatically adapts to light/dark mode)
- 📱 Works on all devices (phone, tablet, desktop)
- 💾 Persistent storage with automatic saving
- 🔄 Drag dishes between active menu and pantry
- 🎯 Icon customization for each dish
- 🔐 Secure behind Home Assistant authentication

## What's in here

```
custom_components/meal_menu/__init__.py        # WebSocket get/save backed by Store + panel registration
custom_components/meal_menu/manifest.json
custom_components/meal_menu/meal-menu-panel.js # the panel UI (a web component)
custom_components/meal_menu/config_flow.py     # UI setup flow
```

## Installation

### Method 1: HACS (Recommended) 🎯

#### Step 1: Install via HACS
1. **Add Custom Repository:**
   - Open HACS in your Home Assistant
   - Click the three dots menu in the top right
   - Select "Custom repositories"
   - Add repository URL: `https://github.com/maxga/ha-meal-menu`
   - Category: `Integration`
   - Click "Add"

2. **Install the Integration:**
   - Search for "Meal Menu" in HACS
   - Click on it and select "Download"
   - Choose the latest version and download

3. **Restart Home Assistant**

#### Step 2: Set up the integration 🚀

1. Go to **Settings** → **Devices & Services**
2. Click **+ Add Integration**
3. Search for **"Meal Menu"**
4. Click to add it
5. That's it! The "Meal Menu" appears in your sidebar automatically! ✨

No YAML configuration is required — the integration registers the sidebar panel
and serves the panel JS for you.

### Method 2: Manual Installation

1. **Download the latest release** from [GitHub Releases](https://github.com/maxga/ha-meal-menu/releases)

2. **Copy files:**
   - Copy `custom_components/meal_menu/` to `config/custom_components/meal_menu/`
     (the panel JS lives inside this folder — nothing goes in `config/www`)

3. **Restart Home Assistant**

4. **Add the integration:** Settings → Devices & Services → **+ Add Integration** → **Meal Menu**

## How it behaves

- **Shared:** every phone, tablet, and browser reads/writes the same JSON file
  (`config/.storage/meal_menu`).
- **Works remotely:** because it's served on HA's own origin, it loads anywhere
  HA does — through Nabu Casa or your reverse proxy — with no mixed-content or
  extra-firewall issues. Nothing new is exposed to the internet.