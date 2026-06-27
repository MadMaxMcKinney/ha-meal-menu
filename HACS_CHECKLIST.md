# HACS Integration Checklist

This checklist is based on the official HACS documentation for integration repositories.

## ✅ Required Files and Structure

### Repository Structure
- [x] Single integration per repository
- [x] Files in `custom_components/INTEGRATION_NAME/` directory
- [x] Repository has a description on GitHub
- [x] Repository has topics on GitHub (add: `hacs`, `homeassistant`, `home-assistant`, `meal-menu`)
- [x] Repository has a README with usage instructions

### Required Files
- [x] `README.md` - Documentation
- [x] `hacs.json` - HACS configuration
- [x] `info.md` - Rich user experience (optional but recommended)
- [x] `custom_components/meal_menu/__init__.py` - Integration initialization
- [x] `custom_components/meal_menu/manifest.json` - Integration manifest

### manifest.json Requirements
- [x] `domain` field
- [x] `name` field
- [x] `version` field
- [x] `documentation` field (URL to docs)
- [x] `issue_tracker` field (URL to issues)
- [x] `codeowners` field (list of GitHub usernames)

### hacs.json Requirements
- [x] `name` field (required)
- [x] `homeassistant` field (minimum version)
- [x] `country` field (optional, ISO 3166-1 alpha-2)
- [x] `content_in_root` field (set to false)

### Brand Assets
- [ ] `custom_components/meal_menu/brand/icon.png` (256x256px) - **NEEDS REAL IMAGE**
- [ ] `custom_components/meal_menu/brand/icon@2x.png` (512x512px) - **NEEDS REAL IMAGE**

## ⚠️ Action Items

1. **Create proper brand icons:**
   - Replace placeholder files in `custom_components/meal_menu/brand/`
   - Use a 256x256px PNG for `icon.png`
   - Use a 512x512px PNG for `icon@2x.png`
   - Transparent background recommended
   - Consider using Material Design Icons "silverware-fork-knife"

2. **Add GitHub repository topics:**
   - Go to your GitHub repository settings
   - Add topics: `hacs`, `homeassistant`, `home-assistant`, `integration`, `meal-planning`

3. **Create GitHub releases:**
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   # Then create a release on GitHub from this tag
   ```

## 📚 Documentation Sources

- [HACS Integration Requirements](https://www.hacs.xyz/docs/publish/integration/)
- [HACS General Requirements](https://www.hacs.xyz/docs/publish/start/)
- [HACS Custom Repositories](https://www.hacs.xyz/docs/faq/custom_repositories/)
- [Home Assistant manifest.json docs](https://developers.home-assistant.io/docs/creating_integration_manifest/)

## 🧪 Testing Your Repository

1. Add as custom repository in HACS:
   - HACS → 3 dots menu → Custom repositories
   - Add URL: `https://github.com/maxga/ha-meal-menu`
   - Category: Integration
   - Click ADD

2. Check for validation errors in HACS logs

3. Verify integration appears correctly with name and description

4. Test installation and setup through UI