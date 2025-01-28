import { bind, Variable } from "astal";
import { Gtk } from "astal/gtk3";
import Mpris from "gi://AstalMpris"
import { truncate } from "../../utils/StringUtils";

const priorityList: string[] = [
    "Mozilla firefox",
];

const ignoreList: string[] = [
    "VLC media player"
];

function getPriorityPlayer(players: Mpris.Player[]): Mpris.Player | null {
    let maxPriority = Infinity;
    let currentPlayer = null;
    for (var player of players) {
        if (player.identity in ignoreList) {
            continue;
        }

        let newPriority = priorityList.indexOf(player.identity)

        if ((newPriority != -1 && newPriority < maxPriority) || currentPlayer == null) {
            if (newPriority != -1) {
                maxPriority = newPriority;
            }

            currentPlayer = player;
        }
    }

    return currentPlayer;
}

function MediaInfo(player: Mpris.Player) {
    const title_bind = bind(player, "title");
    const artist_bind = bind(player, "artist");

    const display: Variable<string> = Variable.derive(
        [title_bind, artist_bind],
        (title: string, artist: string) => {
            const newtitle = title ? title : "No Title";
            const newartist = artist ? artist : "No Artist";

            return `${newtitle} - ${newartist}`
        }
    );

    return <box>
        {bind(player, "coverArt").as(cover => (<box
            className="Cover"
            visible={cover != null && cover.length > 0}
            valign={Gtk.Align.CENTER}
            css={`background-image: url('${cover}');`}
        />))}
        {<label
            className="text-mid"
            maxWidthChars={40}
            truncate={true}
            label={bind(display)}
            tooltipText={bind(display)}
        />}
    </box>
}

export function Media() {
    const mpris = Mpris.get_default()

    return <box className="Media bar-box">
        {bind(mpris, "players").as(ps => { 
            const player = getPriorityPlayer(ps)
            return player ? (
                MediaInfo(player)
            ) : (
                <label
                    className="text-mid"
                >
                    No Media
                </label>
            )
        })}
    </box>
}
