import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class AeroPeekPreferences extends ExtensionPreferences {
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
            subtitle: 'Do not hide the active window on toggle.',
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
            title: 'Position on panel',
            subtitle: 'Where to place the toggle on the panel.',
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
        const positionIdx = positionValues.indexOf(currentPosition);
        positionRow.set_selected(positionIdx >= 0 ? positionIdx : 0);

        positionRow.connect('notify::selected', () => {
            settings.set_string(
                'position-in-panel',
                positionValues[positionRow.get_selected()]
            );
        });

        groupAspect.add(positionRow);

        // Toggle icon

        const iconRow = new Adw.ActionRow({
            title: 'Toggle Icon (.svg)',
            subtitle: 'Icon file used for the panel toggle.',
        });

        const iconButton = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            tooltip_text: 'Click to change icon',
        });
        iconButton.set_child(new Gtk.Label());

        const updateIconLabel = () => {
            const iconName = settings.get_string('toggle-icon');
            let label;

            if (iconName.startsWith('/')) {
                label = GLib.basename(iconName);
            } else {
                label = `${iconName}.svg`;
            }
            iconButton.get_child().set_label(label);
        };
        updateIconLabel();

        const iconChangedId = settings.connect('changed::toggle-icon', updateIconLabel);
        window.connect('destroy', () => settings.disconnect(iconChangedId));

        iconButton.connect('clicked', () => {
            const fileDialog = new Gtk.FileDialog({
                title: 'Choose an icon',
            });

            const filter = new Gtk.FileFilter();
            filter.add_mime_type('image/svg+xml');
            filter.set_name('Images (SVG)');

            const filterList = new Gio.ListStore({item_type: Gtk.FileFilter});
            filterList.append(filter);
            fileDialog.set_filters(filterList);

            const currentIcon = settings.get_string('toggle-icon');
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
                        if (path) settings.set_string('toggle-icon', path);
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
        });

        const iconBox = new Gtk.Box({
            spacing: 12,
            valign: Gtk.Align.CENTER,
        });
        iconBox.append(iconButton);
        iconBox.append(resetButton);

        iconRow.add_suffix(iconBox);
        groupAspect.add(iconRow);

        /**
         * Preview
         */

        const groupPeek = new Adw.PreferencesGroup({
            title: 'Peek',
        });
        page.add(groupPeek);

        // Peek on hover

        const peekOnHoverRow = new Adw.ActionRow({
            title: 'Peek on hover',
            subtitle: 'Make windows transparent when hovering the button.',
        });
        const peekOnHoverSwitch = new Gtk.Switch({
            active: settings.get_boolean('peek-on-hover'),
            valign: Gtk.Align.CENTER,
        });

        settings.bind(
            'peek-on-hover',
            peekOnHoverSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        peekOnHoverRow.add_suffix(peekOnHoverSwitch);
        peekOnHoverRow.activatable_widget = peekOnHoverSwitch;
        groupPeek.add(peekOnHoverRow);

        // Peek delay

        const peekDelayRow = new Adw.ActionRow({
            title: 'Peek delay (ms)',
            subtitle: 'Delay before making windows transparent.',
        });
        const peekDelaySpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1000,
                step_increment: 50,
                page_increment: 100,
            }),
            valign: Gtk.Align.CENTER,
        });

        settings.bind(
            'peek-delay',
            peekDelaySpin,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        peekDelayRow.add_suffix(peekDelaySpin);
        groupPeek.add(peekDelayRow);

        // Peek duration

        const peekDurationRow = new Adw.ActionRow({
            title: 'Peek duration (ms)',
            subtitle: 'Animation duration for transparency effect.',
        });
        const peekDurationSpin = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 1000,
                step_increment: 50,
                page_increment: 100,
            }),
            valign: Gtk.Align.CENTER,
        });

        settings.bind(
            'peek-duration',
            peekDurationSpin,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        peekDurationRow.add_suffix(peekDurationSpin);
        groupPeek.add(peekDurationRow);

        // Peek opacity

        const peekOpacityRow = new Adw.ActionRow({
            title: 'Window opacity (%)',
            subtitle: 'Opacity percentage during peek (0-100).',
        });
        const peekOpacityScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            draw_value: true,
            value_pos: Gtk.PositionType.RIGHT,
            digits: 0,
            valign: Gtk.Align.CENTER,
            hexpand: true,
        });
        peekOpacityScale.set_range(0, 100);
        peekOpacityScale.set_increments(5, 10);

        settings.bind(
            'peek-opacity',
            peekOpacityScale.get_adjustment(),
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        peekOpacityRow.add_suffix(peekOpacityScale);
        groupPeek.add(peekOpacityRow);

        /**
         * Shortcuts
         */

        const groupShortcut = new Adw.PreferencesGroup({
            title: 'Shortcuts',
        });
        page.add(groupShortcut);

        const shortcutRow = new Adw.ActionRow({
            title: 'Toggle windows',
            subtitle: 'Toggle windows with your keyboard instead of a click.',
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
                text: 'Enter new shortcut',
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
