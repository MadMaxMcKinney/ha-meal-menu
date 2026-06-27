# Meal Menu — Home Assistant integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/maxga/ha-meal-menu.svg)](https://github.com/maxga/ha-meal-menu/releases)

A simple breakfast/lunch/dinner menu board with a "pantry" of saved dishes. The integration provides a visual menu board for organizing meals with persistent storage.

**Features:**
- 🎨 Full Home Assistant theme support (automatically adapts to light/dark mode)
- 📱 Works on all devices (phone, tablet, desktop)
- 💾 Persistent storage with automatic saving
- 🔄 Move dishes between active menu and pantry
- 🎯 Icon customization for each dish

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

No YAML configuration is required, the integration registers the sidebar panel
and serves the panel JS for you.

### Method 2: Manual Installation

1. **Download the latest release** from [GitHub Releases](https://github.com/maxga/ha-meal-menu/releases)

2. **Copy files:**
   - Copy `custom_components/meal_menu/` to `config/custom_components/meal_menu/`
     (the panel JS lives inside this folder — nothing goes in `config/www`)

3. **Restart Home Assistant**

4. **Add the integration:** Settings → Devices & Services → **+ Add Integration** → **Meal Menu**