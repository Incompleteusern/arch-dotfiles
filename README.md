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
- `initpackage.sh` which installs packages used

I don't know how well `init.sh` works right now, actually run anything here at your own risk :)


## TODO

TODO:
- todo obsidian documentation
- icon theme
- keepassxc yt-dlp onefetch krita tldr bandwhich cheat
- separate theming
- https://github.com/catppuccin/steam?
- https://wiki.archlinux.org/title/Trash_management
- Customize nvim
- https://wiki.archlinux.org/title/laptop#Hibernate_on_low_battery_level
- Stop bundling `.sty` or something
- Document https://wiki.archlinux.org/title/OpenSSH#Deny
- https://www.reddit.com/r/archlinux/comments/116dd58/is_it_possible_to_default_remove_make/
- Firewall
- Document time sync
- https://wiki.archlinux.org/title/Improving_performance
- Learn tmux
- Change mouse or something idk
- Customize oh-my-zsh more
- Configs for desktop
  - EWW
    - Add customization if mute
- Customize firefox + fork mozilla? 
- Test untested parts
  - Wait till kernel 6.2 since goofy wifi
- Switch to lightdm 

# Installation


## Manual
### Pre-Boot
- Standard installation
- resize EFI partition size to 1GB (TODO)
- Three partitions and encryption (UNTESTED!!!)
  - Make root, user, and swap partitions using `cblsk` and part labels `cryptroot`, `cryptuser`, and `cryptswap`
  - https://wiki.archlinux.org/title/Dm-crypt/Device_encryption
  ```
     # cryptsetup benchmark
     # cryptsetup --type luks2 --verify-passphrase --sector-size 4096 --verbose luksFormat /dev/disk/by-partlabel/cryptroot
     # cryptsetup --type luks2 --verify-passphrase --sector-size 4096 --verbose luksFormat /dev/disk/by-partlabel/cryptuser
     # cryptsetup --type luks2 --verify-passphrase --sector-size 4096 --verbose luksFormat /dev/disk/by-partlabel/cryptswap
     
     # cryptsetup luksHeaderBackup /dev/disk/by-partlabel/cryptroot --header-backup-file /mnt/backupcrypt/root.img
     # cryptsetup luksHeaderBackup /dev/disk/by-partlabel/cryptuser --header-backup-file /mnt/backupcrypt/user.img
     
     # cryptsetup open /dev/disk/by-partlabel/cryptroot root
     # cryptsetup open /dev/disk/by-partlabel/cryptuser user
     # cryptsetup open /dev/disk/by-partlabel/cryptswap swap
  ```
  - Unmount, close crypt, and remount to make sure that everything is working smoothly
  - Mount and make file systems
    ```
      # mkfs.ext4 /dev/mapper/root
      # mkfs.ext4 /dev/mapper/user
      # mkswap -L swap /dev/mapper/swap
      # mkdir /mnt/boot
            
      # mount LABEL=root /dev/mapper/root /mnt
      # mount LABEL=user /dev/mapper/user /mnt/home
      # mount LABEL=EFI /mnt/boot
      # swapon -L swap
    ```
- Generate fstab
  - Use `LABEL=swap swap swap defaults 0 0` for swap (UNTESTED!!!)
- Chroot
  - ```
      # arch-chroot /mnt
      # export PS1="(chroot) ${PS1}"
    ```
- `pacstrap` the following
  - `pacstrap /mnt base base-devel linux linux-firmware nano sudo intel-ucode` 
  - Linux install | `linux linux-firmware`
  - Processor Microcode | `intel-ucode`
  - Text Editor | `nano nano-syntax-highlighting`
  - Network Manager | `networkmanager` and enable service
- Disk Encryption (UNTESTED!!!)
  - https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LUKS_on_a_partition
  - Configure `/etc/mkinitcpio.conf`, and add `systemd keyboard sd-vconsole sd-encrypt` presence
  ```
    HOOKS=(base udev systemd keyboard autodetect modconf kms sd-vconsole block sd-encrypt filesystems fsck)
  ```
  - Regenerate initramfs
- Swap Encryption and Hibernation | `tpm2-tss tpm2-tools` (UNTESTED!!!)
  - Configure `/etc/mkinitcpio.conf`, and add `resume` after `udev`
  - Check `cat /sys/class/tpm/tpm0/tpm_version_major` has `2`
  - List available TPMs at `systemd-cryptenroll --tpm2-device=list`
  - Enroll key with `systemd-cryptenroll --tpm2-device=auto --tpm2-pcrs=0,7 /dev/disk/by-partlabel/cryptswap`
  - Test that it works with `/usr/lib/systemd/systemd-cryptsetup attach swap /dev/disk/by-partlabel/cryptswap - tpm2-device=auto`
  - Add `rd.luks.options=SWAP_UUID=tpm2-device=auto` to kernel parameters
- Systemd-boot (ENCRYPTION KERNEL PARAMS UNTESTED!!!)
  - https://wiki.archlinux.org/title/Systemd-boot
  - Use `/boot` as mount point and run `bootctl install`
  - Add in at `/boot/loader/entries/arch.conf`
    ```
      title   Arch Linux
      linux   /vmlinuz-linux
      initrd  /intel-ucode.img
      initrd  /initramfs-linux.img
      options rd.luks.name=ROOT_UUID=root root=/dev/mapper/root rd.luks.name=USER_UUID=user rd.luks.name=SWAP_UUID=swap resume=/dev/mapper/swap rw quiet splash acpi_backlight=vendor nowatchdog
    ```
   - TODO document params
## Post-Boot

- Secure Boot | `sbctl`
  - https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface/Secure_Boot#sbctl
  - Verify with `sbctl status`, reset keys and enable set up mode
  - `sbctl create-keys`
  - `sbctl enroll-keys -m` and check status again
  - Sign files with `sbctl sign-all`
  - Check everything works with `sbctl status` and `sbctl list-files`
  - Add pacman hooks from https://wiki.archlinux.org/title/Systemd-boot#pacman_hook
  - Re-enable Secure Boot
- Unified Kernel Image
  - Move kernel parameters to `/etc/kernel/cmdline`
  - Make bundled image with 
    ```
       sbctl bundle -s -i /boot/intel-ucode.img \
           -k /boot/vmlinuz-linux \
           -f /boot/initramfs-linux.img \
           -c /etc/kernel/cmdline \
           /boot/EFI/Linux/archlinux.efi
    ```
  - Regenerate with `sbctl generate-bundles --sign`
  - Remove default systemd-boot, remove `arch.conf`
  - Do same for fallbacks if enough size in partition
  
- Clean Up Boot Options
  - `efibootmgr` can list and remove them as necessary

- Add user
  `# useradd -m $user; passwd $user; usermod -aG wheel,audio,video,optical,storage $user`
- Add wheel group to sudoers | `sudo`
  - Use `visudo`
  - Uncomment `# %wheel ALL=(ALL) ALL/%wheel ALL=(ALL:ALL) ALL`
  - Add
    ```
    Defaults      env_reset
    Defaults      editor=/usr/bin/rnano, !env_editor
    Defaults      passwd_timeout=0
    ```
- git, ssh/gpg | `git openssh github-cli`
  ```
     $ gh auth login
     $ ssh-keygen -t ed25519 -C "$email"; ssh-add ~/.ssh/id_ed25519
     $ gh ssh-key add ~/.ssh/id_ed25519.pub --title $hostname
     $ gcl git@github.com:Incompleteusern/dotfiles.git
     $ gpg --full-generate-key
     $ gpg --list-secret-keys --keyid-format=long
     $ git config --global user.signingkey $KEY 
     $ git config --global commit.gpgsign true
     $ git config --global user.email "$email"
     $ git config --global user.name "$name"
  ```
- Run `initpackage.sh` and then `init.sh`

## Auto
- yay | `base-devel`
- Mirror management | `reflector`
  - Set US as country
  - Enable `reflector.timer`
- Enable Color, ILoveCandy, VerbosePkgLists, multilib and ParallelDownloads in /etc/pacman.conf
- Make `makepkg` multithread
  - https://unix.stackexchange.com/questions/268221/use-multi-threaded-make-by-default
- zshrc | `zsh`
- Pacman Utils | `paccache pacgraph pacman-contrib informant`
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

    * * * * * eww -c ~/.config/eww/bar update clock_minute="$(date +\%M)"
    0 * * * * eww -c ~/.config/eww/bar update clock_time="$(date +\%I)"
    0 0 * * * eww -c ~/.config/eww/bar update clock_date="$(date '+%m/%d')"; eww -c ~/.config/eww/bar up>
    0 0 1 * * eww -c ~/.config/eww/bar update calendar_month="$(date '+%m')"
    0 0 1 1 * eww -c ~/.config/eww/bar update calendar_year="$(date '+%Y')"
    ```
  - TODO automate this
- Add `OWM_API_KEY` to be exported frm .env

## Auto
- Compositor | `hyprland qt5-wayland qt6-wayland` 
- XDG Integration | `xdg-utils xdg-desktop-portal-hyprland`
- Status Bars | `eww-wayland`
- Wallpapers | `swww` 
- Notification System | `dunst libnotify` 
- Session Locker | `swaylockd swaylock-effects swayidle`
- Font Input | `fcitx5 fcitx5-chinese-addons fcitx5-configtool fcitx-gtk fcitx5-pinyin-zhwiki fcitx5-qt`
- App Launcher | `rofi-lbonn-wayland papirus-icon-theme sif networkmanager-dmenu` 
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
  gpu power saving, audio power save


## Auto
- Desktop Control | `brightnessctl pamixer`
- Fonts | `ttf-ms-fonts noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra ttf-jetbrains-mono-nerd ttf-jetbrains-mono ttf-iosevka-nerd`
  - Set Chinese as font priority
- Screenshots | `grim slurp wl-clipboard jq` (grimblast)
- Scheduler | `cronie`
- Command Line
  - Replace cat | `bat`
  - Replace ls | `exa`
  - Find | `fzf`, `fd`
  - Requests | `httpie`
  - Ping | `gping`
  - Git diff | `git-delta`
- power | `tlp tlp-rdw`
- spotify integration | `playerctl`
- System Information | `htop neofetch duf`
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
  - Use duckduckgo, ublock origin, h26ify, privacy badger, stylus
  - Use https only
  - TODO automatically copy pref.js + extensions?
  - Set `media.ffmpeg.vaapi.enabled` to true

- Use catpuccin mocha pink LOL
  - Through stylus
    - https://github.com/catppuccin/github
    - https://github.com/catppuccin/modrinth
    - https://github.com/catppuccin/duckduckgo
    - https://github.com/catppuccin/youtube
    - https://github.com/catppuccin/reddit
 - Through extension
    - https://github.com/catppuccin/firefox
    - https://github.com/catppuccin/vscode
    - https://github.com/catppuccin/jetbrains
- Through theming tool
    - https://github.com/catppuccin/gtk
    - https://github.com/catppuccin/qt5ct (extend to qt6ct)
- Use papirus-icon-theme for `nwg-look`, `qt5ct qt6c6` (pink folders)
 
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
- Spotify |`spotify-edge spotifywm spotify-adblock spicetify`
- Neovim | `nvim` (TODO nvimdots)
- Intellij | `intellij-idea-community-edition`
- Theming | `qt5ct qt6ct nwg-look`
- File Manager | `thunar papirus-folders-git gvfs rmtrash trash-cli`
- Tor | `tor tor-browser`
