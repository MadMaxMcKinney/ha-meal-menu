"""Meal Menu — JSON storage backend for the custom panel.

This integration does one job: expose two authenticated WebSocket commands the
panel uses to read and write the menu. Data is persisted with Home Assistant's
Store helper, which writes a single JSON file to ``config/.storage/meal_menu``.
Because it goes through the WebSocket API, it inherits HA's auth and works the
same locally or remotely — no extra server, port, or database.
"""
from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    DOMAIN,
    PANEL_FILENAME,
    PANEL_ICON,
    PANEL_NAME,
    PANEL_TITLE,
    PANEL_URL_PATH,
)

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = "meal_menu"
DEFAULT_DATA = {"entries": []}

# URL the panel JS is served from. We register a static path mapped to the
# integration directory, then point the panel's module_url at this base.
URL_BASE = "/meal_menu_panel"

# One menu entry. Validated server-side so a malformed client can't corrupt the
# store. `icon` is an mdi name (e.g. "mdi:egg-fried"); `title` is free text.
ENTRY_SCHEMA = vol.Schema(
    {
        vol.Required("id"): str,
        vol.Required("title"): str,
        vol.Required("icon"): str,
        vol.Required("meal"): vol.In(["breakfast", "lunch", "dinner"]),
        vol.Required("location"): vol.In(["pantry", "active"]),
    }
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Meal Menu from a config entry."""
    # Initialize storage
    hass.data.setdefault(DOMAIN, {})

    # Set up storage and WebSocket commands. Commands are global, so guard
    # against re-registering them if the entry is reloaded.
    if "store" not in hass.data[DOMAIN]:
        hass.data[DOMAIN]["store"] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        websocket_api.async_register_command(hass, ws_get)
        websocket_api.async_register_command(hass, ws_save)

    # Serve the panel JS straight from the integration directory. Guarded so a
    # config-entry reload doesn't try to register the same path twice.
    if not hass.data[DOMAIN].get("static_registered"):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    URL_BASE,
                    hass.config.path(f"custom_components/{DOMAIN}"),
                    cache_headers=False,
                )
            ]
        )
        hass.data[DOMAIN]["static_registered"] = True

    # Register the sidebar panel. This is an async coroutine, so it's awaited
    # directly (not run in an executor). Keyword args keep the parameter order
    # unambiguous. The panel is a native ES module custom element that reads
    # `.hass`, so it's loaded via module_url with no iframe.
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name=PANEL_NAME,
        module_url=f"{URL_BASE}/{PANEL_FILENAME}",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        require_admin=False,
        config={},
    )

    _LOGGER.info("Meal Menu integration loaded - panel registered")

    # Store entry reference
    hass.data[DOMAIN][entry.entry_id] = entry

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # Remove the panel
    panel_custom.async_remove_panel(hass, PANEL_URL_PATH)

    # Clean up entry data
    if entry.entry_id in hass.data[DOMAIN]:
        del hass.data[DOMAIN][entry.entry_id]

    return True


@websocket_api.websocket_command({vol.Required("type"): "meal_menu/get"})
@websocket_api.async_response
async def ws_get(hass, connection, msg):
    """Return the stored menu, or an empty menu if nothing is saved yet."""
    store: Store = hass.data[DOMAIN]["store"]
    data = await store.async_load()
    connection.send_result(msg["id"], data or DEFAULT_DATA)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "meal_menu/save",
        vol.Required("entries"): [ENTRY_SCHEMA],
    }
)
@websocket_api.async_response
async def ws_save(hass, connection, msg):
    """Persist the full list of entries (last write wins)."""
    store: Store = hass.data[DOMAIN]["store"]
    await store.async_save({"entries": msg["entries"]})
    connection.send_result(msg["id"], {"success": True})