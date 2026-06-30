import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const AeroPeakButton = GObject.registerClass(
    class AeroPeakButton extends PanelMenu.Button {
        _init(extension) {
            super._init(0.0, extension.metadata.name, true);
            this._extension = extension;

            const iconName =
                this._extension._settings.get_string('toggle-icon');
            let iconParams = {
                style_class: 'system-status-icon',
            };

            if (iconName.startsWith('/')) {
                const file = Gio.File.new_for_path(iconName);
                iconParams.gicon = new Gio.FileIcon({file: file});
            } else {
                iconParams.icon_name = iconName;
            }

            const icon = new St.Icon(iconParams);
            this.add_child(icon);

            this.connect('enter-event', () => {
                this._extension.previewDesktop(true);
            });
            this.connect('leave-event', () => {
                this._extension.previewDesktop(false);
            });
        }

        vfunc_event(event) {
            if (event.type() === Clutter.EventType.BUTTON_PRESS) {
                this._extension.toggleWindows();
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        }
    }
);

export default class AeroPeakForWindows extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._settingsConnections = [];
        this._settingsConnections.push(
            this._settings.connect('changed::position-in-panel', () =>
                this._refreshIndicator()
            )
        );
        this._settingsConnections.push(
            this._settings.connect('changed::toggle-icon', () =>
                this._refreshIndicator()
            )
        );

        this._indicator = new AeroPeakButton(this);

        Main.wm.addKeybinding(
            'toggle-shortcut', // name of the key (in the schema)
            this._settings, // Settings object
            Meta.KeyBindingFlags.NONE, // No specific flags
            Shell.ActionMode.ALL, // Active everywhere
            () => {
                this.toggleWindows();
            }
        );

        const positionMap = {
            'extreme-left': {box: 'left', index: 0},
            left: {box: 'left', index: -1},
            center: {box: 'center', index: 0},
            right: {box: 'right', index: 0},
            'extreme-right': {box: 'right', index: -1},
        };
        const position =
            positionMap[this._settings.get_string('position-in-panel')];

        Main.panel.addToStatusArea(
            this.uuid,
            this._indicator,
            position.index,
            position.box
        );
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;

        this._settingsConnections?.forEach(id => this._settings.disconnect(id));
        this._settingsConnections = null;
        this._settings = null;

        Main.wm.removeKeybinding('toggle-shortcut');
    }

    _refreshIndicator() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._indicator = new AeroPeakButton(this);

        const positionMap = {
            'extreme-left': {box: 'left', index: 0},
            left: {box: 'left', index: -1},
            center: {box: 'center', index: 0},
            right: {box: 'right', index: 0},
            'extreme-right': {box: 'right', index: -1},
        };
        const position =
            positionMap[this._settings.get_string('position-in-panel')];

        Main.panel.addToStatusArea(
            this.uuid,
            this._indicator,
            position.index,
            position.box
        );
    }

    toggleWindows() {
        const workspace = global.workspace_manager.get_active_workspace();
        const windows = workspace.list_windows();
        const validWindows = windows.filter(w => !this._shouldIgnore(w));
        const hasUnminimized = validWindows.some(w => !w.minimized);

        if (hasUnminimized) {
            validWindows.forEach(w => w.minimize());
        } else {
            validWindows.forEach(w => w.unminimize());
        }
    }

    previewDesktop(enable) {
        const workspace = global.workspace_manager.get_active_workspace();
        const windows = workspace.list_windows();

        windows.forEach(w => {
            if (w.minimized) return;
            if (enable && !this._settings.get_boolean('peak-on-hover')) return;
            if (this._shouldIgnore(w)) return;

            const actor = w.get_compositor_private();
            if (actor) {
                actor.remove_all_transitions(); // Cancel any ongoing animation to avoid conflicts
                actor.ease({
                    opacity: enable
                        ? (this._settings.get_int('peak-opacity') / 100) * 255
                        : 255,
                    duration: this._settings.get_int('peak-duration'),
                    delay: enable ? this._settings.get_int('peak-delay') : 0,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            }
        });
    }

    /**
     * Handle ignored windows that break the toggle behaviour, like system windows
     * (from https://github.com/amivaleo/Show-Desktop-Button)
     */
    _shouldIgnore(window) {
        if (!window) return true;

        const focusedWindow = global.display.get_focus_window();
        if (
            window === focusedWindow &&
            this._settings.get_boolean('keep-active-window')
        ) {
            return true;
        }

        const windowType = window.get_window_type();
        if (
            windowType === Meta.WindowType.DESKTOP ||
            windowType === Meta.WindowType.DOCK ||
            windowType === Meta.WindowType.MODAL_DIALOG
        ) {
            return true;
        }

        const wmClass = (window.get_wm_class() ?? '').toLowerCase();
        if (wmClass.includes('gjs') || wmClass.includes('prefs')) {
            return true;
        }

        return false;
    }
}
