import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class AeroPeakPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        /**
         * Behaviour
         */
        const groupBehaviour = new Adw.PreferencesGroup({
            title: 'Behaviour',
        });
        page.add(groupBehaviour);

        const keepActiveRow = new Adw.ActionRow({
            title: 'Keep active window',
            subtitle: 'Do not hide the active window when toggling',
        });
        const keepActiveSwitch = new Gtk.Switch({
            active: settings.get_boolean('keep-active-window'),
            valign: Gtk.Align.CENTER,
        });
        settings.bind(
            'keep-active-window',
            keepActiveSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        keepActiveRow.add_suffix(keepActiveSwitch);
        keepActiveRow.activatable_widget = keepActiveSwitch;
        groupBehaviour.add(keepActiveRow);
    }
}
