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

        /**
         * Aspect
         */

        const groupAspect = new Adw.PreferencesGroup({
            title: 'Aspect',
        });
        page.add(groupAspect);

        // Position dropdown

        const positionRow = new Adw.ComboRow({
            title: 'Panel position',
            subtitle: 'Where to place the button in the panel',
        });

        const positionModel = new Gtk.StringList();
        positionModel.append('Extreme Left');
        positionModel.append('Left');
        positionModel.append('Center');
        positionModel.append('Right');
        positionModel.append('Extreme Right');

        positionRow.set_model(positionModel);

        const positionValues = [
            'extreme-left',
            'left',
            'center',
            'right',
            'extreme-right',
        ];
        const currentPosition = settings.get_string('position-in-panel');
        positionRow.set_selected(positionValues.indexOf(currentPosition));

        positionRow.connect('notify::selected', () => {
            settings.set_string(
                'position-in-panel',
                positionValues[positionRow.get_selected()]
            );
        });

        groupAspect.add(positionRow);

        // Icon

        const iconRow = new Adw.EntryRow({
            title: 'Icon name',
        });
        iconRow.set_text(settings.get_string('toggle-icon'));

        settings.bind(
            'toggle-icon',
            iconRow,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        groupAspect.add(iconRow);

        /**
         * Aperçu
         */

        const groupPeak = new Adw.PreferencesGroup({
            title: 'Peak',
        });
        page.add(groupPeak);

        // Peak on hover

        const peakOnHoverRow = new Adw.ActionRow({
            title: 'Peak on hover',
            subtitle: 'Make windows transparent when hovering the button',
        });
        const peakOnHoverSwitch = new Gtk.Switch({
            active: settings.get_boolean('peak-on-hover'),
            valign: Gtk.Align.CENTER,
        });

        settings.bind(
            'peak-on-hover',
            peakOnHoverSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        peakOnHoverRow.add_suffix(peakOnHoverSwitch);
        peakOnHoverRow.activatable_widget = peakOnHoverSwitch;
        groupPeak.add(peakOnHoverRow);

        // Peak delay

        const peakDelayRow = new Adw.ActionRow({
            title: 'Peak delay (ms)',
            subtitle: 'Delay before making windows transparent',
        });
        const peakDelaySpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1000,
                step_increment: 50,
                page_increment: 100,
            }),
            valign: Gtk.Align.CENTER,
        });

        settings.bind(
            'peak-delay',
            peakDelaySpin,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        peakDelayRow.add_suffix(peakDelaySpin);
        groupPeak.add(peakDelayRow);

        // Peak duration

        const peakDurationRow = new Adw.ActionRow({
            title: 'Peak duration (ms)',
            subtitle: 'Animation duration for transparency effect',
        });
        const peakDurationSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1000,
                step_increment: 50,
                page_increment: 100,
            }),
            valign: Gtk.Align.CENTER,
        });

        settings.bind(
            'peak-duration',
            peakDurationSpin,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        peakDurationRow.add_suffix(peakDurationSpin);
        groupPeak.add(peakDurationRow);

        // Peak opacity

        const peakOpacityRow = new Adw.ActionRow({
            title: 'Window opacity (%)',
            subtitle: 'Opacity percentage during peak (0-100)',
        });
        const peakOpacityScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
            digits: 0,
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });
        peakOpacityScale.set_range(0, 100);
        peakOpacityScale.set_increments(5, 10);

        settings.bind(
            'peak-opacity',
            peakOpacityScale.get_adjustment(),
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        peakOpacityRow.add_suffix(peakOpacityScale);
        groupPeak.add(peakOpacityRow);
    }
}
