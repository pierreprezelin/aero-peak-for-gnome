import St from 'gi://St';
import Clutter from 'gi://Clutter';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

export default class AeroPeakForWindows extends Extension {
    enable() {
        log('Aero Peak: Enable called');
        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Add an icon
        const icon = new St.Icon({
            icon_name: 'face-laugh-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(icon);

        // Connect click behaviour
        this._indicator.connect('button-press-event', () => {
            log('clicked');
            return Clutter.EVENT_PROPAGATE;
        });
        log('Aero Peak: Event connected');

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        log('Aero Peak: Disabled called');
        this._indicator?.destroy();
        this._indicator = null;
    }
}
