This is a work in progress.

# "Allegiances"

- Pacman Wrapper: `paru`, used `yay` and want to test it out
- Networking: `networkmanager`
- Window Manager: `Hyprland`
- Text Editor: a mess really, vscode and jetbrains and nvim are all good except for I am too lazy for nvim
- Color Scheme: `catppuccin`
- Terminal: `alacritty`
- More allegiances to come in the future :|.

# References

This has the arch install guide as a reference as well as 
[https://jpetazzo.github.io/2024/02/23/archlinux-luks-tpm-secureboot-install/](here)
[https://github.com/joelmathewthomas/archinstall-luks2-lvm2-secureboot-tpm2](here)
[https://gist.github.com/michaelb081988/0e3f1bbd3bb04fb34c0726e28da2a934](here)
[https://gist.github.com/orhun/02102b3af3acfdaf9a5a2164bea7c3d6#mount-efi-partition](and here).

# Pre-installation

## Partitioning

|  Partition | Size  | fdisk Type  | PARTLABEL |  File System |
| ------------ | ------------ | ------------ |  ------------ |  ------------ |
| EFI System | N/A  | N/A | <EFI> | N/A |
| Linux Extended Boot | 1 GB  | xbootldr | BOOT | fat32 |
| Linux Partition | Remainder  | fd | cryptlvm | volume |

* Make partitions with fdisk or cfdisk, and label them with gdisk
* I am dual booting so an EFI file system exists already which I will use and not touch with a ten foot pole, so this is why we have an extended boot partition.
* I am an idiot and I also want to try about btrfs so this goes hand in hand

## Filesystems

This is roughly isomorphic to https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LVM_on_LUKS and merges a few others:

We first overrwrite the Linux Partition with random data for security reasons:
```bash
dd if=/dev/urandom of=/dev/disk/by-partlabel/cryptlvm bs=1M status=progress
```
where `of` is the desired disk to outout to. Now, we set up the luks container.
```bash
# cryptsetup benchmark # benchmark cryptsetup if you want

cryptsetup -v luksFormat /dev/disk/by-partlabel/cryptlvm # create luks container, use an actual password ideally?
cryptsetup luksHeaderBackup /dev/disk/by-partlabel/cryptlvm --header-backup-file header.img # backup the header somewhere, since if the header gets destroyed the data is inaccessible
cryptsetup open /dev/disk/by-partlabel/cryptlvm lvm # open the container at /dev/mapper/lvm
```

Here's the plan for the logical volume:

|  Logical Volume | Size  |  File System |
| ------------ | ------------ | ------------ |
| Root | 32 GB  | ext4 |
| Swap | 16 GB | swap |
| Home | Remaining - 256 MiB  | ext4 |

Let's now create our lvm volume and populate it:
```bash
pvcreate /dev/mapper/lvm # Create a physical volume
vgcreate VolGroup /dev/mapper/lvm # Create a volume group to add to

# Create all your logical volumes on the volume group:
lvcreate -L 32G VolGroup -n root
lvcreate -L 16G VolGroup -n swap
lvcreate -l 100%FREE VolGroup -n home
lvreduce -L -256M VolGroup/home # Since we format a logical volume with ext4, we leave at least 256 MiB free space in the volume group to allow using e2scrub.
```
We then make our file systems (making an EFS separately if necessart)
```bash
mkfs.ext4 /dev/VolGroup/root
mkfs.ext4 /dev/VolGroup/home
mkswap /dev/VolGroup/swap
mkfs.vfat -n BOOT /dev/disk/by-partlabel/boot
```
and then mount them
```bash
mount /dev/VolGroup/root /mnt
mount --mkdir /dev/VolGroup/home /mnt/home
swapon /dev/VolGroup/swap
mount --mkdir /dev/disk/by-partlabel/<EFI> /mnt/efi
mount --mkdir /dev/disk/by-partlabel/BOOT /mnt/boot
```

# Installation

## Standard

Change some pacman things and then pacstrap a bunch of things (here, `<CHIP>` is `intel` or `amd` depending on what chip type you use)
```bash
sed -i "s/^#ParallelDownloads/ParallelDownloads/" /etc/pacman.conf 
sed -i "s/^#Color/Color/" /etc/pacman.conf # colors :D

reflector --save /etc/pacman.d/mirrorlist \
--protocol https --latest 5 --sort age

pacstrap -K /mnt base linux linux-firmware linux-headers <CHIP>-ucode nano efibootmgr sudo networkmanager vim man-db man-pages 
```
Then generate an fstab
```bash
genfstab -U /mnt >> /mnt/etc/fstab # -L also works
```
We can now arch chroot and follow the [arch wiki's steps](https://wiki.archlinux.org/title/Installation_guide#Configure_the_system) pretty bat for bat up till the initramfs step
```bash
arch-chroot /mnt
ln -sf /usr/share/zoneinfo/<Region>/<City> /etc/localtime 
hwclock --systohc
sed -i "s/^#en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/" /etc/locale.gen
locale-gen
echo "KEYMAP=us" >> /etc/vconsole.conf # replace with corresponding keymap
echo "<hostname>" >> /etc/hostname # and corresponding hostname

passwd # set root password
```

##  Booting

I use `systemd-boot` so let's install that, and also install `lvm2` for later.
```bash
bootctl install --boot-path=/boot --esp-path=/efi # omit arguments if no extended boot dir
pacman -S lvm2
```
and then make a default `<ESP>/loader/loader.conf` (`<ESP> = /boot` here for dual booting)
```bash
console-mode auto
default @saved
timeout 10
editor no
```

Make a copy of `/etc/mkinitcpio.conf` and then edit the `HOOKS=` line
```bash
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole sd-encrypt block lvm2 filesystems fsck)
```
adding `systemd, keyboard, sd-vconsole, sd-encrypt, lvm2` where `sd-vconsole` is optional if you aren't using standard `/etc/vconsole.conf`.

We can now create a basic `<ESP>/loader/entries/arch.conf`
```
title Arch Linux
linux /vmlinuz-linux
initrd /initramfs-linux.img
options rd.luks.name=<DEVICE-UUID>=lvm root=/dev/VolGroup/root rw
```
(here, `<DEVICE-UUID>` is the uuid for the root partition)
(Though by virtue of [automounting](https://wiki.archlinux.org/title/Systemd#GPT_partition_automounting), specifying the root and resume may be unnecessary).

Finally, run `mkinitcpio -p linux` and we should be all good for now. Run
```
efibootmgr
```
and it should show the boot manager, if not run the [following](https://wiki.archlinux.org/title/Systemd-boot#Manual_entry_using_efibootmgr):
```
# efibootmgr --create --disk /dev/<sdX> --part <Y> --loader '\EFI\systemd\systemd-bootx64.efi' --label "Linux Boot Manager" --unicode
```
where `<sdX> <Y>` is the EFI partition.

Rebooting here should be fine (use space to access our arch linux entry specifically).
```bash
exit
umount -R /mnt
reboot
```

# Post-Installation

## Unified Kernel Image

Some actual things for `/etc/cmdline.d/root.conf`:
```bash
rd.luks.name=<DEVICE-UUID>=lvm root=/dev/VolGroup/root resume=/dev/VolGroup/swap rw splash acpi_backlight=vendor audit=0 bgrt_disable rd.shell=0 rd.emergency=reboot
```

Edit `/etc/mkinitcpio.d/linux.preset` uncommenting the `default_uki` and `fallback_uki` options, storing things in `/boot` preferably. Uncomment `default_options` too.

Now `arch.conf` is unnecessary and can be removed. Rebuild `mkinitcpio -P`.

## Secure Boot

Before this, disable secure boot / put it in setup mode.

Install `pacman -S sbctl sbsigntools` and then ensure `sbctl status` outputs `Setup Mode` as enabled.

Then create signing keys and enroll them
```bash
sbctl create-keys
sbctl enroll-keys --microsoft # needed for dual booting
sbctl verify
sbctl verify | sed 's/✗ /sbctl sign -s /e' # for each of the earlier files, microsoft not being signed is fine. -s creates a hook for signing this file
sbctl list-files
```

Regenerate initramfs after this and re-enable secure boot.

## TPM

We can now enroll our luks key into TPM (which is pretty secure modulo some privacy things that probably only matter if you are running from a government) to not need to enter our password each time. Secure boot should be on for this.

Make sure `cat /sys/class/tpm/tpm0/tpm_version_major` outputs 2.

```bash
pacman -S tpm2-tools # Install the TPM tools
```

We then run the following
```bash
systemd-cryptenroll --tpm2-device=list # Check the name of the kernel module for our TPM
systemd-cryptenroll --recovery-key /dev/disk/by-partlabel/cryptlvm # Generate a recovery key
systemd-cryptenroll --tpm2-device=auto /dev/disk/by-partlabel/cryptlvm --tpm2-pcrs=0+7 # 0 can be omitted
# systemd-cryptenroll /dev/disk/by-partlabel/cryptlvm --wipe-slot=password # wipe the password if necessary
```
Afterwards, add `rd.luks.options=<DEVICE-UUID>=tpm2-device=auto` to the entries to avoid entering the password again (editting `crypttab.initramfs` is an alternative). Add the kernel module to 
`MODULES=`, like below
```
MODULES=(tpm_crb)
```

If the state of secure boot or firmware changes, running
```bash
systemd-cryptenroll --wipe-slot=tpm2 /dev/disk/by-partlabel/cryptlvm --tpm2-pcrs=0+7
```
wipes the slot which allows for it to be re-enrolled.

## User

```bash
useradd -m <user>
passwd <user>

sudoedit /etc/sudoers # uncomment %wheel ALL=(ALL:ALL) ALL
usermod -G wheel <user>
```

### Pacman

We multithread makepkg. Change `/etc/makepkg.conf` to have
```
-j<cores> -l<cores>
```
where `<cores>` is the output of `nproc`.

We then install `reflector` and then write in `/etc/xdg/reflector/reflector.conf`:
```
--save /etc/pacman.d/mirrorlist
--protocol https
--country US
--latest 5
```
and then start `reflector.timer` and `reflector.service`.

And now we install [paru](https://github.com/Morganamilo/paru).
```bash
sudo pacman -S --needed git base-devel
git clone https://aur.archlinux.org/paru.git
cd paru
makepkg -si
cd ..
rm -rf paru
```
From here on we omit installing the package itself, and just write | `package-name other-package`
to indicate a package.
We now install some other helpers to clean the pacman cache and force reading update notes respectively | `paccache informant` 
```bash
systemctl enable paccache.timer
usermod -aG informant <user>
```
Finally, we now enable `Color, VerbosePkgLists, ParallelDownloads` and add `ILoveCandy` (if you haven't already) in `/etc/pacman.conf` and include `multilib`.

### Git

We set up a gpg / ssh key (though reuse is pretty possible), | `openssh git github-cli`
```bash
gh auth login # use ssh
ssh-keygen -t ed25519 -C "$email"; ssh-add ~/.ssh/id_ed25519
gh ssh-key add ~/.ssh/id_ed25519.pub --title $hostname
gpg --full-generate-key
gpg --list-secret-keys --keyid-format=long
git config --global user.signingkey $KEY
git config --global commit.gpgsign true
git config --global user.email "$email"
git config --global user.name "$name"
```

## Operating System

We enable some SSD things here, see [this link](https://wiki.archlinux.org/title/Dm-crypt/Specialties#Disable_workqueue_for_increased_solid_state_drive_(SSD)_performance) and [this one](https://wiki.archlinux.org/title/Dm-crypt/Specialties#Discard/TRIM_support_for_solid_state_drives_(SSD)) (read these links for security info).

```bash
cryptsetup --allow-discards --persistent  --perf-no_read_workqueue --perf-no_write_workqueue refresh lvm
cryptsetup luksDump /dev/disk/by-partlabel/cryptlvm | grep Flags # confirm
systemctl enable fstrim.timer
```
(tpm2 doesn't work for these commands it seems).

### Intel

Follows [here](https://wiki.archlinux.org/title/Intel_graphics), a decent amount of 
this is likely platform dependent shrug.

We first install some drivers for intel | `mesa lib32-mesa vulkan-intel lib32-vulkan-intel`
and then add the following to `/etc/modprobe.d/i1915.conf`
```
options i915 enable_guc=3 enable_fbc=1 
```

For hardware acceleration, use [here](https://wiki.archlinux.org/title/Hardware_video_acceleration#Intel) to find the packages | `intel-media-driver libvdpau-va-gl libva-utils vdpauinfo`
Afterwards, add `export LIBVA_DRIVER_NAME=iHD` and `export VDPAU_DRIVER=va_gl` to `/etc/environment`.

### Power Saving

We install a temperature and power manager | `thermald tlp`
```bash
systemctl enable thermald tlp.service
systemctl mask systemd-rfkill.service systemd-rfkill.socket # for tlp
```

### Time Sync

We use chrony for time sync as a laptop | `chrony networkmanager-dispatcher-chrony`
```bash
systemctl enable chronyd.service
usermod -aG chrony <user>
```

## Networking

We implement [https://wiki.archlinux.org/title/Network_configuration#localhost_is_resolved_over_the_network](this) by adding the following to `/etc/hosts`:
```
127.0.0.1        localhost
::1              localhost
```

We will use `systemd-resolved` 
```bash
systemctl enable systemd-resolved.service
ln -sf ../run/systemd/resolve/stub-resolv.conf /etc/resolv
```
which has nice enough defaults. 

We also set up mac address randomization in `/etc/NetworkManager/conf.d/wifi_rand_mac.conf`
```
[device-mac-randomization]
wifi.scan-rand-mac-address=yes

[connection-mac-randomization]
ethernet.cloned-mac-address=random
wifi.cloned-mac-address=random
```

# Desktop

## work in progress

We install `hyprland`
```bash
todo idk
```

We install a terminal `alacritty`.

## TODO

copy `/etc/reflector.conf`
copy `/etc/chrony.conf`

boot change protections look into chkboot
look into backups
- firewall

zsh hibernate and suspend alias

ripgrep

cava conf

# Command Line

- Replace cat | `bat`
- Replace ls | `exa`
- Find | `fzf`, `fd`
- Requests | `httpie`
- Ping | `gping`
- Git Info | `git-delta onefetch`
- Command Info | `tldr man-db`
- Youtube Downloader | `yt-dlp`
- System Information | `htop neofetch duf bandwhich`

And also here's some random terminal things :D
- Random silly terminal commands | `cowsay fortune-mod sl`
- Fancy displays | `cbonsai pipes.sh cava`

# TO PROCESS

# zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-/home/"$USER"/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-/home/"$USER"/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-completions.git ${ZSH_CUSTOM:-/home/"$USER"/.oh-my-zsh/custom}/plugins/zsh-completions
rm .bash_history .bash_logout .bash_profile .bashrc

# papirus folders
papirus-folders -C pink --theme Papirus

# enable plymouth mocha
plymouth-set-default-theme -R catppuccin-mocha

# enable spicetify mocha
chmod 777 /opt/spotify
chmod 777 -R /opt/spotify/Apps

spicetify backup
spicetify config current_theme catppuccin-mocha
spicetify config color_scheme lavender
spicetify config inject_css 1 replace_colors 1 overwrite_assets 1
spicetify config extensions catppuccin-mocha.js

# market place
curl -fsSL https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/install.sh | sh

# von
#git clone https://github.com/Incompleteusern/von/

cat <<EOT >> /home/"$USER"/.gitconfig
[core]
    pager = delta

[interactive]
    diffFilter = delta --color-only

[delta]
    navigate = true    # use n and N to move between diff sections
    light = false      # set to true if you're in a terminal w/ a light background color (e.g. the default macOS terminal)
    line-numbers = true
    side-by-side = true
[merge]
    conflictstyle = diff3

[diff]
    colorMoved = default
EOT

# More to process

## Thanks to

- [scotus-1](https://github.com/scotus-1/dotfiles) for format and what to use
- [flick-0](https://github.com/flick0/dotfiles) for various configs, old waybar
- [Saimoomedits](https://github.com/Saimoomedits/eww-widgets) for the top bar
  - Modified for catppuccin theming, hyprland and spotify
  - TODO move to fork?
- [catppuccin](https://github.com/catppuccin) for the pastel theming over basically everything possible
  - For rofi, Deathmonic specficially is used
- [ayamir](https://github.com/ayamir/nvimdots/wiki/Plugins) for nvim reference

## TODO

TODO:


- update to hyprutils-git, hyprcurosr-git, hyprlang-git, hyprwayland-scanner-git:
- pamixer to wpctl
- document ripgrep
- https://github.com/end-4/dots-hyprland/tree/illogical-impulse replace eww and try it out
- https://github.com/tkashkin/Adwaita-for-Steam
- im sick of the wallpaper changing, find one wall paper i love and keep it forever
- update wallpapers to get rid of ones I don't like, your name wallpapers
- https://github.com/NoiSek/Aether
- qbittorrent?
- keepassxc
- Customize nvim (not for now)
- https://wiki.archlinux.org/title/laptop#Hibernate_on_low_battery_level
- Stop bundling `.sty` or something
- Document https://wiki.archlinux.org/title/OpenSSH#Deny
- Firewall
- https://wiki.archlinux.org/title/Improving_performance
- Customize oh-my-zsh more
- https://wiki.archlinux.org/title/Makepkg#Tips_and_tricks
- Test untested parts (NEVER)
- Get spotify to work for local files
- look into musicbee

# Installation

## Manual

## Auto

- zshrc | `zsh`
- Make closing lid initiate sleep

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

- Desktop Control | `brightnessctl pamixer`
- Compositor | `hyprland qt5-wayland qt6-wayland`
- XDG Integration | `xdg-utils xdg-desktop-portal-hyprland`
- Status Bars | TODO
- Wallpapers | TODO hyprpaper?
- Notification System | `dunst libnotify`
- Session Locker | TODO hyprlock?
- Font Input | TODO look into `fcitx5 fcitx5-chinese-addons fcitx5-configtool fcitx-gtk fcitx5-pinyin-zhwiki fcitx5-qt mozc`
- App Launcher | TODO look into
- Terminal | `alacritty`
- Pipewire | `pipewire wireplumber pipewire-jack pipewire-pulse`
- Display Manager | TODO
- Color Temperature | `gammastep`
- Booting Animation | TODO how does this work `plymouth`
- Color Picker `hyprpicker`
- Polkit | TODO `polkit-kde-agent` does an alternative exist yet?

- Fonts | `ttf-ms-fonts noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra ttf-jetbrains-mono-nerd ttf-jetbrains-mono ttf-iosevka-nerd`
  - Set Chinese as font priority
- Screenshots | `grimblast-git`
- Scheduler | `cronie`
- Spotify Integration | `playerctl`
- crontab | `fcron`

# Applications

## Manual

- Firefox
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
- Intellij | `intellij-idea-community-edition`
- File Manager | `thunar gvfs rmtrash trash-cli thunar-archive-plugin thunar-media-tags-plugin thunar-volman` (check out dolphin)
- Tor | `tor torbrowser-launcher`
- krita | `krita`

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
  - https://github.com/catppuccin/mdBook
  - https://github.com/catppuccin/discord
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
