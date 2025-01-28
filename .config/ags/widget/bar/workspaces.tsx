import { bind, Variable } from "astal";
import { Gdk, Gtk, Widget } from "astal/gtk3";
import Hyprland from "gi://AstalHyprland?version=0.1";

export const hideEmptyWorkspaces = Variable(false);

const hypr = Hyprland.get_default();
const _wss = bind(hypr, "workspaces");
const _fw = bind(hypr, "focusedWorkspace");

const display: Variable<any> = Variable.derive(
    [_wss, _fw],
    (wss, fw) => [wss, fw]
);

function idFloor(i: number) {
    return Math.floor((i - 1)/10)*10;
}

function wsUsed(i: number) {
    return hypr.get_workspace(i) != null;
}

function applyCssToWs(box: Widget.Box) {
    let focusedId = hypr.focusedWorkspace.id;
    let offset = idFloor(focusedId);
    // @ts-ignore
    box.children.forEach((button: Widget.Box, i: number) => {
        const ws = hypr.get_workspace(offset + i + 1);
        const ws_before = hypr.get_workspace(offset + i);
        const ws_after = hypr.get_workspace(offset + i + 2);
        button.toggleClassName("occupied", ws && ws?.clients.length > 0 || focusedId == (offset + i+1));
        const occLeft = !ws_before || (ws_before?.clients.length <= 0 && focusedId != (offset + i));
        const occRight = !ws_after || (ws_after?.clients.length <= 0 && focusedId != (offset + i+2));
        button.toggleClassName("occupied-left", occLeft);
        button.toggleClassName("occupied-right", occRight);
    });
}

const WorkspaceButton = (i: number) => {
    return <button className="ws-button"
            onClick={() => {
                hypr.message_async(`dispatch workspace ${i}`, null)
            }}
            setup={self => {
                let runActive = (button: Widget.Button) => button.toggleClassName("active", hypr.focusedWorkspace.id == i);

                runActive(self);
                self.hook(_fw, runActive);
            }}
        >
            <label maxWidthChars={5} truncate={true} className="ws-button-label" label={`${i}`} />
        </button>
}

const WorkspaceButtons = (focusedId: number) =>
    Array.from({length: 10}, (_, i) => idFloor(focusedId) + i + 1).map(i => WorkspaceButton(i));

let oldFloor = -1;

export const Workspaces = () => { 
    return <box className="ws-container bar-box"
            setup={self => {
                let genChildren = (wrapper: Widget.Box, fw: Hyprland.Workspace) => {
                    let newFloor = idFloor(fw.id);
                    if (newFloor != oldFloor) {
                        oldFloor = newFloor;
                    
                        wrapper.children = WorkspaceButtons(fw.id);
                        applyCssToWs(self);
                    }
                }

                genChildren(self, hypr.focusedWorkspace);
                applyCssToWs(self);

                self.hook(display, applyCssToWs);
                self.hook(hypr, "client-added", applyCssToWs);
                self.hook(hypr, "client-removed", applyCssToWs);
                self.hook(_fw, genChildren);
            }}
        >
    </box>
}

export default Workspaces;

