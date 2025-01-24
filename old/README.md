# This is pretty old, and I want to go over it again

The computer I want to install onto doesn't actually support gentoo installation medium, so I might as well use Arch instead. 
These steps will be gone over again and made not incoherent, and I will find some other way of doing dotfiles that doesn't involve rm -rf spamming everywhere in bash files.

## Thanks to

- [scotus-1](https://github.com/scotus-1/dotfiles) for format and what to use
- [flick-0](https://github.com/flick0/dotfiles) for various configs, old waybar
- [Saimoomedits](https://github.com/Saimoomedits/eww-widgets) for the top bar
  - Modified for catppuccin theming, hyprland and spotify
  - TODO move to fork?
- [catppuccin](https://github.com/catppuccin) for the pastel theming over basically everything possible
  - For rofi, Deathmonic specficially is used
- [Arch wiki](https://wiki.archlinux.org/) and [various](https://wiki.archlinux.org/title/User:Bai-Chiang/Installation_notes) [other](https://gist.github.com/orhun/02102b3af3acfdaf9a5a2164bea7c3d6) [guides](https://www.reddit.com/r/archlinux/comments/zo83gb/how_i_setup_secure_boot_for_arch_linux_simple/) [about](https://gist.github.com/michaelb081988/0e3f1bbd3bb04fb34c0726e28da2a934) for notes over encryption and so forth
- [This](https://www.reddit.com/r/archlinux/comments/rz6294/arch_linux_laptop_optimization_guide_for/) nice guide for optimization
- [MarianArlt](https://github.com/MarianArlt/sddm-sugar-dark/) for sddm theme, forked for catppuccin theming
- [ayamir](https://github.com/ayamir/nvimdots/wiki/Plugins) for nvim reference


## INFO

These dotfiles come with three terrible scripts as of last updated:

- `local.sh` which syncs local files into this github repo
- `sync.sh` which syncs bundled github repos into local files, note that this contains repos I have forked
- `init.sh` which installs the github repo into an arch install, should be run as root
- `init-package.sh` which installs packages used

I don't know how well `init.sh` works right now, actually run anything here at your own risk :)

## TODO

TODO:

- update to hyprutils-git, hyprcurosr-git, hyprlang-git, hyprwayland-scanner-git:
- pamixer to wpctl
- swaylockd doesnt exist anymore sob
- hyprlock?
- document ag
- https://github.com/end-4/dots-hyprland/tree/illogical-impulse replace eww and try it out
- https://github.com/tkashkin/Adwaita-for-Steam
- im sick of the wallpaper changing, find one wall paper i love and keep it forever
- update wallpapers to get rid of ones I don't like, your name wallpapers
- https://github.com/NoiSek/Aether
- https://wiki.archlinux.org/title/System_time#Update_timezone_every_time_NetworkManager_connects_to_a_network
- qbittorrent?
- wait for https://github.com/catppuccin/cli to replace the bundle of hacks I have right now
- keepassxc
- Customize nvim (not for now)
- https://wiki.archlinux.org/title/laptop#Hibernate_on_low_battery_level
- Stop bundling `.sty` or something
- Document https://wiki.archlinux.org/title/OpenSSH#Deny
- Firewall
- Document time sync
- https://wiki.archlinux.org/title/Improving_performance
- Customize oh-my-zsh more
- https://wiki.archlinux.org/title/Makepkg#Tips_and_tricks
- fix sync.sh
- Configs for desktop
  - EWW
    - Add customization if mute
- Customize firefox + fork mozilla?
- Test untested parts (NEVER)
- Switch to lightdm
- Get spotify to work for local files

# Installation

## Manual

## Auto

- zshrc | `zsh`
- Pacman Utils | `paccache pacman-contrib informant`
- NetworkManager
  - [Add local host to /etc/hosts](https://wiki.archlinux.org/title/Network_configuration#localhost_is_resolved_over_the_network)
  - Use 1.1.1.1, 8.8.8.8 for default dns, mac address randomization
  - Use basic `systemd-resolvd`
- Make closing lid initiate sleep
- Systemd-timesyncd for basic time syncing

# Desktop

## TODO

## Manual

- Add `sd-plymouth` hook when sd-encrypt actually used
  - Configure `/etc/mkinitcpio.conf`, and add `systemd keyboard sd-vconsole sd-encrypt` presence
  ```
    HOOKS=(base udev systemd sd-plymouth keyboard autodetect modconf kms sd-vconsole block sd-encrypt filesystems fsck)
  ```
- Fcronjob for wall paper timer and ewww

  - ```
    systemctl enable fcron.service
    systemctl enable fcrontimer.service
    fcrontab -e
    ```
  - Then (TODO this is terrible)

    ```
    SHELL=/usr/bin/zsh
    PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
    XDG_RUNTIME_DIR=/run/user/1000
    WAYLAND_DISPLAY=wayland-1

    !exesev,bootrun

    */15 * * * * source ~/.env; bash ~/.scripts/wallpaper/wallpaper.sh
    ```

  - TODO automate this

- Add `OWM_API_KEY` to be exported frm .env

## Auto

- Compositor | `hyprland qt5-wayland qt6-wayland`
- XDG Integration | `xdg-utils xdg-desktop-portal-hyprland`
- Status Bars | `eww`
- Wallpapers | `swww`
- Notification System | `dunst libnotify`
- Session Locker | `swaylockd swaylock-effects swayidle`
- Font Input | `fcitx5 fcitx5-chinese-addons fcitx5-configtool fcitx-gtk fcitx5-pinyin-zhwiki fcitx5-qt mozc`
- App Launcher | `rofi-lbonn-wayland networkmanager-dmenu`
- Terminal | `alacritty`
- Pipewire | `pipewire wireplumber pipewire-jack pipewire-pulse`
- Display Manager | `sddm sddm-conf`
- Color Temperature | `gammastep`
- Booting Animation | `plymouth`
- Color Picker `hyprpicker`
- Polkit | `polkit-kde-agent`

# Utilities

## Manual

- Order Chinese as priority for Noto CJK

  - https://wiki.archlinux.org/title/Localization/Simplified_Chinese#Chinese_characters_displayed_as_variant_(Japanese)_glyphs
  - TODO automate that shit

- Most of this is intel or computer specific to me

  - https://wiki.archlinux.org/title/Intel_graphics and https://wiki.archlinux.org/title/Power_management#Power_saving
  - Early kms
    - Add `i915` in `MODULES=()`, regenerate initramfs
    - In `/etc/modprobe.d/i915.conf`
      ```
      options i915 enable_guc=2 enable_fbc=1 enable_psr=1
      ```
  - Hardware acceleration
    - ```
       yay -S intel-media-driver libvdpau-va-gl libva-utils vdpauinfo
      ```
    - Add `export LIBVA_DRIVER_NAME=iHD` and `export VDPAU_DRIVER=va_gl`, check that things still work with `vainfo` and `vdpauinfo`
    - Move environment variables to ` /etc/environment`
  - Thermald
    - ```
      yay -S thermald
      systemctl enable thermald
      ```
  - Module stuff

    - Add in `/etc/modprobe.d/audio_powersave.conf`

      ```
      options snd_hda_intel power_save=1
      ```

    - Add in `/etc/sysctl.d/dirty.conf`

          ```
          vm.dirty_writeback_centisecs = 6000
          ```

      TODO gpu power saving, audio power save

## Auto

- Desktop Control | `brightnessctl pamixer`
- Fonts | `ttf-ms-fonts noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra ttf-jetbrains-mono-nerd ttf-jetbrains-mono ttf-iosevka-nerd`
  - Set Chinese as font priority
- Screenshots | `grimblast-git`
- Scheduler | `cronie`
- Command Line
  - Replace cat | `bat`
  - Replace ls | `exa`
  - Find | `fzf`, `fd`
  - Requests | `httpie`
  - Ping | `gping`
  - Git Info | `git-delta onefetch`
  - Command Info | `tldr man-db`
  - Youtube Downloader | `yt-dlp`
  - System Information | `htop neofetch duf bandwhich`
- power | `tlp tlp-rdw`
- Spotify Integration | `playerctl`
- crontab | `fcron`

# Silly

## Manual

## Auto

- fortune | `fortune`
- cmatrix | `cmatrix`
- ascii art `ascii-rain asciiquarium sl donut.c`

# Applications

## Manual

- Firefox

  - Block reddit in /etc/hosts most of the time
  - Use duckduckgo, ublock origin, h26ify, privacy badger, stylus
  - Use https only
  - TODO automatically copy pref.js + extensions?
  - Set `media.ffmpeg.vaapi.enabled` to true

- use `cups` for printer stuff.
  - Do https://wiki.archlinux.org/title/avahi#hostname_resolution
  - todo automate, move to installation section too?
- enable firefox hardware acceleration, reopen tabs on close
  - TODO automate?

## Auto

- Firefox | `firefox`
- Discord | `discord-electron-bin discord-update-skip`
- Prism Launcher | `prismlauncher`
- Steam | `steam`
- Vs Code | `visual-studio-code-bin`
- VPN | `openvpn protonvpn-gui networkmanager-openvpn`
- Spotify |`spotify-edge spotifywm spicetify`
- Neovim | `nvim` (TODO nvimdots)
- Intellij | `intellij-idea-community-edition` (have ultimate somehow)
- File Manager | `thunar gvfs rmtrash trash-cli thunar-archive-plugin thunar-media-tags-plugin thunar-volman`
- Tor | `tor torbrowser-launcher`
- krita | `krita`
- joplin | `joplin`

# Theming

## Manual

- Use catpuccin mocha pink LOL
  - Through stylus
    - https://github.com/catppuccin/github
    - https://github.com/catppuccin/modrinth
    - https://github.com/catppuccin/duckduckgo
    - https://github.com/catppuccin/youtube
    - https://github.com/catppuccin/reddit (irrelevant)
    - https://github.com/catppuccin/proton
    - https://github.com/catppuccin/twitch
    - https://github.com/catppuccin/hacker-news
    - https://github.com/catppuccin/monkeytype
- Through extension
  - https://github.com/catppuccin/firefox
  - https://github.com/catppuccin/vscode
  - https://github.com/catppuccin/jetbrains
  - https://github.com/catppuccin/vscode-icons
  - https://github.com/catppuccin/joplin
- Through theming tool
  - https://github.com/catppuccin/gtk
  - https://github.com/catppuccin/qt5ct (extend to qt6ct)
- Manually
  - https://github.com/catppuccin/prismlauncher
  - https://github.com/catppuccin/bat
  - https://github.com/catppuccin/fzf
  - https://github.com/catppuccin/tty
- GTK and QT
  - Use JetBrains Mono 10 font
  - phinger cursors
  - pink folders
    ```
    papirus-folders -C cat-mocha-pink --theme Papirus
    ```

## Auto

- Theming Tools | `qt5ct qt6ct nwg-look`
- Papirus | `papirus-folders-catppuccin-git papirus-icon-theme-git`
- Cursors | `phinger-cursors`
