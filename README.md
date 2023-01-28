## Thanks to

https://github.com/scotus-1/dotfiles for format and what to use xd
https://github.com/flick0/dotfiles for various configs
https://github.com/catppuccin for the pastel theming

## TODO

TODO:
- Worry about fonts
- Learn tmux
- Configure neofetch
- Change mouse or something idk
- Do redshift alternative
- Customize oh-my-fsh more
- Configs for desktop
  - Switch to eww from waybar
    - recustomize
  - redo dunst theme
  - redo alacritty theme
  - Wallpaper script time!!!!
  - EWW
    - Do which widgets I want first lol
    - Try to supersede wifi menu with a widget
    - Make a custom script to check for arch updates
    - Language
    - Do CSS
- Screensharing, App Launchers, App Clients, Color Pickers
    - aka Configure Rest of Desktop
- Decide whether to use XDG Desktop Portal?
- Customize firefox + fork mozilla? 
- Go through general preference :SOB:
- Add disk encryption
  - Do this in February when wifi-adapter is natively supported by udev
- AI gen might be fun for wall paper
- Stop bundling other people's github repos, add a way to install froms ource

# Installation

## Manual
- Standard Installation
  - https://wiki.archlinux.org/title/Installation_guide
  - Right now, temporary android tether to set up and get driver rtw89 manually
- Linux install | `linux linux-firmware`
- Mirror management | `reflector`
  - Set US as country
  - Enable `reflector.tiemr`
- Add user (after arch-chroot) 
  - `useradd -m $user; passwd $user; usermod -aG wheel,audio,video,optical,storage $user`
- Add wheel group to sudoers | `sudo`
  - Uncomment `# %wheel ALL=(ALL) ALL/%wheel ALL=(ALL:ALL) ALL`
- Processor Microcode | `intel-ucode`
- Text Editor | `nano nano-syntax-highlighting`
- git, ssh/gpg | `git openssh github-cli`
  - ```
       gh auth login
       ssh-keygen -t ed25519 -C "$email"; ssh-add ~/.ssh/id_ed25519
       gh ssh-key add ~/.ssh/id_ed25519.pub --title $hostname
       git clone git@github.com:Incompleteusern/dotfiles.git
       gpg --full-generate-key
       gpg --list-secret-keys --keyid-format=long
       git config --global user.signingkey $KEY
       git config --global commit.gpgsign true
       git config --global user.email "$email"
       git config --global user.name "$name"
       echo "export GPG_TTY=\$(tty)" >> ~/.bash_profile
       echo "export GPG_TTY=\$(tty)" >> ~/.profile
- Network Manager | `networkmanager` and enable service
- 
## Auto
- Enable Color and ParallelDownloads in /etc/pacman.conf
- yay | `base-devel`
- add ~/script to path
- zshrc | `zsh`
- Pacman Utils | `paccache pacgraph`
- Add local host to /etc/hosts
  - `echo -e "127.0.0.1        localhost\n::1              localhost" >> /etc/hosts`

# Desktop

## TODO
- Polkit | `polkit-kde-agent` 
- Display Manager | `sddm`
- 

## Manual

## Auto
- Compositor | `hyprland-git` 
- Wallpapers | `swww-git` 
- Notification System | `dunst libnotify` 
- Status Bars | `waybar-hyprland-git otf-font-awesome ttf-meslo-nerd-font-powerlevel10k`
- Pipewire | `pipewire wireplumber pipewire-pulse pipewire-jack `
- XDG Integration | `xdg-utils xdg-desktop-portal-wlr`
- Terminal | `alacritty-git`
- App Launcher | `rofi-lbonn-wayland-git papirus-icon-theme-git sif-git ttf-jetbrains-mono-nerd ttf-jetbrains-mono ttf-iosevka-nerd` 
- Volume Control | `pamixer`

# Utilities
## Manual
## Auto
- neofetch | `neofetch-git`
- brightness | `brightnessctl`
- fonts | `ttf-ms-fonts noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra ttf-material-icons-git ttf-symbola`
- screenshots | `grim slurp wl-clipboard jq` (grimblast)
- cli
  - Replace cat | `bat`
  - Memory | `duf`
  - Replace ls | `exa`
  - Replace find | `fzf`, `fd`
  - Requests | `httpie`
  - Ping | `gping-git`
- power | `tlp tlp-rdw`

# Silly
## Manual
## Auto
- cbonsai | `cbonsai-git`
- donut.c | `donut.c`
- cmatrix | `cmatrix-git`
- sl | `sl`

# Applications

## Manual
Use catpuccin mocha lavender for firefox and vscode, catpuccin mocha for bd
Use `cups` for printer stuff.
Enable firefox hardware acceleration, reopen tabs on close

## Auto
- Firefox | `firefox`
- Discord | `discord_arch_electron betterdiscordctl`
- Prism Launcher | `prismlauncher`
- Steam | `steam`
- Vs Code | `visual-studio-code-bin`
- VPN | `openvpn protonvpn-gui`
- Spotify |`spotify spotifywm spotify-adblock-git`
