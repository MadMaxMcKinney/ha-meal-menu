"""Meal Menu — JSON storage backend for the custom panel.

This integration does one job: expose two authenticated WebSocket commands the
panel uses to read and write the menu. Data is persisted with Home Assistant's
Store helper, which writes a single JSON file to ``config/.storage/meal_menu``.
Because it goes through the WebSocket API, it inherits HA's auth and works the
same locally or remotely — no extra server, port, or database.
"""
from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.helpers.typing import ConfigType

DOMAIN = "meal_menu"
STORAGE_VERSION = 1
STORAGE_KEY = "meal_menu"
DEFAULT_DATA = {"entries": []}

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


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the storage backend and register the WebSocket commands."""
    hass.data[DOMAIN] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    websocket_api.async_register_command(hass, ws_get)
    websocket_api.async_register_command(hass, ws_save)
    return True


@websocket_api.websocket_command({vol.Required("type"): "meal_menu/get"})
@websocket_api.async_response
async def ws_get(hass, connection, msg):
    """Return the stored menu, or an empty menu if nothing is saved yet."""
    store: Store = hass.data[DOMAIN]
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
    store: Store = hass.data[DOMAIN]
    await store.async_save({"entries": msg["entries"]})
    connection.send_result(msg["id"], {"success": True})
