import Clutter from 'gi://Clutter';
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

            const icon = new St.Icon({
                icon_name: this._extension._settings.get_string('toggle-icon'),
                style_class: 'system-status-icon',
            });
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
        this._settings = null;
        Main.wm.removeKeybinding('toggle-shortcut');
    }

    toggleWindows() {
        const workspace = global.workspace_manager.get_active_workspace();
        const windows = workspace.list_windows();
        const activeWindow = global.display.focus_window;
        const keepActiveWindow = this._settings.get_boolean('keep-active-window');

        const hasVisibleWindows = windows.some(w => {
            if (keepActiveWindow && w === activeWindow) return false;
            return !w.minimized;
        });

        if (hasVisibleWindows) {
            windows.forEach(w => {
                if (keepActiveWindow && w === activeWindow) return;
                w.minimize();
            });
        } else {
            windows.forEach(w => w.unminimize());
        }
    }

    previewDesktop(enable) {
        const workspace = global.workspace_manager.get_active_workspace();
        const windows = workspace.list_windows();
        const activeWindow = global.display.focus_window;
        const keepActiveWindow =
            this._settings.get_boolean('keep-active-window');

        windows.forEach(w => {
            if (w.minimized) return;
            if (!this._settings.get_boolean('peak-on-hover')) return;
            if (keepActiveWindow && w === activeWindow) return;

            const actor = w.get_compositor_private();
            if (actor) {
                actor.ease({
                    opacity: enable
                        ? (this._settings.get_int('peak-opacity') / 100) * 255
                        : 255,
                    duration: this._settings.get_int('peak-duration'),
                    delay: this._settings.get_int('peak-delay'),
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                });
            }
        });
    }
}
