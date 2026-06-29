import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
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

        // Position in panel

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

        // Toggle icon

        const currentIcon = settings.get_string('toggle-icon');

        const iconRow = new Adw.ActionRow({
            title: 'Toggle icon',
            subtitle: 'Icon for the panel button',
        });

        const iconLabel = new Gtk.Label({
            label: currentIcon.startsWith('/')
                ? GLib.basename(currentIcon)
                : currentIcon,
            valign: Gtk.Align.CENTER,
            css_classes: ['caption'],
        });

        const chooseButton = new Gtk.Button({
            label: 'Choose',
            valign: Gtk.Align.CENTER,
        });

        chooseButton.connect('clicked', () => {
            const fileDialog = new Gtk.FileDialog({
                title: 'Choose an icon',
            });

            const filter = new Gtk.FileFilter();
            filter.add_mime_type('image/svg+xml');
            filter.add_mime_type('image/png');
            filter.set_name('Images (SVG, PNG)');

            const filterList = new Gio.ListStore({item_type: Gtk.FileFilter});
            filterList.append(filter);
            fileDialog.set_filters(filterList);

            let initialFolder;

            if (currentIcon.startsWith('/')) {
                const file = Gio.File.new_for_path(currentIcon);
                initialFolder = file.get_parent();
            } else {
                initialFolder = Gio.File.new_for_path(
                    '/usr/share/icons/Adwaita/symbolic/devices/'
                );
            }

            if (initialFolder && initialFolder.query_exists(null)) {
                fileDialog.set_initial_folder(initialFolder);
            }

            fileDialog.open(window, null, (dialog, result) => {
                try {
                    const file = dialog.open_finish(result);
                    if (file) {
                        const path = file.get_path();
                        settings.set_string('toggle-icon', path);
                        iconLabel.set_label(GLib.basename(path));
                    }
                } catch (e) {
                    // User cancelled
                }
            });
        });

        const resetButton = new Gtk.Button({
            icon_name: 'edit-undo-symbolic',
            valign: Gtk.Align.CENTER,
            tooltip_text: 'Reset to default',
        });

        resetButton.connect('clicked', () => {
            settings.reset('toggle-icon');
            const defaultIcon = settings.get_string('toggle-icon');
            iconLabel.set_label(defaultIcon);
        });

        const iconBox = new Gtk.Box({
            spacing: 12,
            valign: Gtk.Align.CENTER,
        });
        iconBox.append(iconLabel);
        iconBox.append(chooseButton);
        iconBox.append(resetButton);

        iconRow.add_suffix(iconBox);
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

        /**
         * Keyboard Shortcut
         */

        const groupShortcut = new Adw.PreferencesGroup({
            title: 'Shortcut',
        });
        page.add(groupShortcut);

        const shortcutRow = new Adw.ActionRow({
            title: 'Toggle shortcut',
            subtitle: 'Keyboard shortcut to show/hide all windows',
        });

        const shortcutLabel = new Gtk.ShortcutLabel({
            disabled_text: 'New shortcut...',
            valign: Gtk.Align.CENTER,
        });

        const currentShortcut = settings.get_strv('toggle-shortcut');
        if (currentShortcut.length > 0) {
            shortcutLabel.set_accelerator(currentShortcut[0]);
        }

        const shortcutButton = new Gtk.Button({
            label: 'Set',
            valign: Gtk.Align.CENTER,
        });

        shortcutButton.connect('clicked', () => {
            const dialog = new Gtk.MessageDialog({
                transient_for: window,
                modal: true,
                buttons: Gtk.ButtonsType.CANCEL,
                text: 'Press new shortcut',
                secondary_text: 'Press Escape to cancel',
            });

            const eventController = new Gtk.EventControllerKey();
            eventController.connect(
                'key-pressed',
                (controller, keyval, keycode, state) => {
                    if (keyval === Gdk.KEY_Escape) {
                        dialog.close();
                        return true;
                    }

                    const mask = state & Gtk.accelerator_get_default_mod_mask();
                    if (Gtk.accelerator_valid(keyval, mask)) {
                        const shortcut = Gtk.accelerator_name(keyval, mask);
                        settings.set_strv('toggle-shortcut', [shortcut]);
                        shortcutLabel.set_accelerator(shortcut);
                        dialog.close();
                    }
                    return true;
                }
            );

            dialog.add_controller(eventController);
            dialog.show();
        });

        const shortcutBox = new Gtk.Box({
            spacing: 12,
            valign: Gtk.Align.CENTER,
        });
        shortcutBox.append(shortcutLabel);
        shortcutBox.append(shortcutButton);

        shortcutRow.add_suffix(shortcutBox);
        groupShortcut.add(shortcutRow);
    }
}
