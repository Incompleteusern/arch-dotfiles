import { Variable, GLib, bind, exec } from "astal"
import { Astal, Gtk, Gdk, Widget } from "astal/gtk3"
import Hyprland from "gi://AstalHyprland"
import Battery from "gi://AstalBattery"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Tray from "gi://AstalTray"
import { Label } from "astal/gtk3/widget"
import { Media } from "./media"
import Workspaces from "./workspaces"

// TODO
// look into popup code
// steal work space code from https://github.com/kotontrion/dotfiles/blob/main/.config/ags/modules/workspaces/hyprland.js
// move sound slider to subwidget
// add brightness slider
// add keyboard backlight sider
// add microphone slider
// add power profile
// https://iconduck.com/sets/adwaita-icon-theme
// sleep, restart, lock, shutdown, hibernate
// nightlight
// bluetooth

// look into event boxes
// look into input shapes

// copy format for time clock thing

function SysTray() {
    const tray = Tray.get_default()

    return <box className="SysTray">
        {bind(tray, "items").as(items => items.map(item => {
            print(item.actionGroup);
            return(
            <menubutton
                tooltipMarkup={bind(item, "tooltipMarkup")}
                usePopover={false}
                actionGroup={bind(item, "actionGroup").as(ag => ["dbusmenu", ag])}
                menuModel={bind(item, "menuModel")}>
                <icon gicon={bind(item, "gicon")} />
            </menubutton>)}
        ))}
    </box>
}

function Wifi() {
    const network = Network.get_default()
    const wifi = bind(network, "wifi")

    return <box visible={wifi.as(Boolean)}>
        {wifi.as(wifi => wifi && (
            <icon
                tooltipText={bind(wifi, "ssid").as(ssid => ssid ?? "None")}
                className="Wifi"
                icon={bind(wifi, "iconName")}
            />
        ))}
    </box>

}

function AudioSlider() {
    const speaker = Wp.get_default()?.audio.defaultSpeaker!

    return <box className="AudioSlider" css="min-width: 140px">
        <icon icon={bind(speaker, "volumeIcon")} />
        <slider
            hexpand
            onDragged={({ value }) => speaker.volume = value}
            value={bind(speaker, "volume")}
        />
    </box>
}

function BatteryLevel() {
    const bat = Battery.get_default()

    return <box className="Battery"
        visible={bind(bat, "isPresent")}>
        <icon icon={bind(bat, "batteryIconName")} />
        <label label={bind(bat, "percentage").as(p =>
            `${Math.floor(p * 100)}%`
        )} className={"text-mid"} />
    </box>
}

function FocusedClient() {
    const hypr = Hyprland.get_default()
    const focusedClient = bind(hypr, "focusedClient");
    const focusedWorkspace = bind(hypr, "focusedWorkspace");

    // @ts-ignore
    return (focusedClient.as(focusedClient => <box
            className="Focused leftrect"
            vertical={true}
            spacing={0}
            widthRequest={150}
        >
            <label
                xalign={0}
                maxWidthChars={20}
                truncate={true}
                className={"top-text"}
                label={focusedClient ? bind(focusedClient, "class") : 'Desktop'}
            />
            <label
                xalign={0}
                maxWidthChars={20}
                truncate={true}
                className={"bottom-text"}
                label={focusedClient ? bind(focusedClient, "title") : focusedWorkspace.as(ws => `Workspace ${ws.id}`)}
            />
        </box>)) as Gtk.Widget;
}

function Time({ format = "%H:%M - %a, %b %e" }) {
    const time = Variable<string>("").poll(1000, () =>
        GLib.DateTime.new_now_local().format(format)!)

    return <box
        className="Time rightrect"
    >
        <label
            className="text-mid"
            onDestroy={() => time.drop()}
            label={time()}
        />
    </box>
}

const Left = () => 
    <box className="wrap-box leftrect" hexpand halign={Gtk.Align.START}>
        <FocusedClient />
        <Workspaces />
    </box>


const Medium = () =>
    <box className="wrap-box">
        <Media />
    </box>


const Right = () => 
    <box className="wrap-box rightrect" hexpand halign={Gtk.Align.END}>
        <box className="bar-box">
            <Wifi />
            <AudioSlider />
            <BatteryLevel />
        </box>
        <Time />
    </box>

export default function Bar(monitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

    return <window
        className="Bar"
        gdkmonitor={monitor}
        exclusivity={Astal.Exclusivity.EXCLUSIVE}
        anchor={TOP | LEFT | RIGHT}>
        <box
            className="wrapper"
        >
            <centerbox>
                {Left()}
                {Medium()}
                {Right()}
            </centerbox>
        </box>
    </window>
}

