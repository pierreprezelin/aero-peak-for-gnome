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
                icon_name: 'computer-symbolic',
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
        this._indicator = new AeroPeakButton(this);
        this._settings = this.getSettings();

        Main.wm.addKeybinding(
            'toggle-shortcut', // name of the key (in the schema)
            this._settings, // Settings object
            Meta.KeyBindingFlags.NONE, // No specific flags
            Shell.ActionMode.ALL, // Active everywhere
            () => {
                this.toggleWindows();
            }
        );
        Main.panel.addToStatusArea(this.uuid, this._indicator);
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

        const hasVisibleWindows = windows.some(w => !w.minimized);

        if (hasVisibleWindows) {
            windows.forEach(w => w.minimize());
        } else {
            windows.forEach(w => w.unminimize());
        }
    }

    previewDesktop(enable) {
        const workspace = global.workspace_manager.get_active_workspace();
        const windows = workspace.list_windows();

        windows.forEach(w => {
            if (w.minimized) return;

            const actor = w.get_compositor_private();
            if (actor) {
                actor.opacity = enable ? 177.5 : 255; // 100 = transparent, 255 = opaque
            }
        });
    }
}
