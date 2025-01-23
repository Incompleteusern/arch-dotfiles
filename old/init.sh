#!/bin/bash

BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ $(whoami | grep "root") != "root" ]]; then
    echo "not root, aborting"
    exit
fi
USER="$(logname)"

# INSTALLATION

# zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-/home/"$USER"/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-/home/"$USER"/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-completions.git ${ZSH_CUSTOM:-/home/"$USER"/.oh-my-zsh/custom}/plugins/zsh-completions
rm .bash_history .bash_logout .bash_profile .bashrc

# fstrim
systemctl enable fstrim.timer

# pacman utils
systemctl enable paccache.timer
systemctl enable reflector.timer
usermod -aG informant "$USER"

cp ${BASEDIR}/reflector.conf /home/"$USER"/etc/xdg/reflector/reflector.conf

# networkmanager
echo "127.0.0.1        localhost" >> /etc/hosts
echo "::1              localhost" >> /etc/hosts

# systemd-resolvd
systemctl enable systemd-resolved.service

# systemd-timesyncd
systemctl enable systemd-timesyncd.service

mkdir --parents /etc/systemd/resolved.conf.d 
cat <<EOT >> /etc/systemd/resolved.conf.d/dnssec.conf
[Resolve]
DNSSEC=allow-downgrade
EOT

# Add colors, downloads, ILoveCandy to /etc/pacman.conf, enable multilib
sed -i "/^#\(Color\|ParallelDownloads\|ILoveCandy\|VerbosePkgLists\)/s/^#//" /etc/pacman.conf
sed -i "/\[multilib\]/,/Include/"'s/^#//' /etc/pacman.conf

# laptop sleep
mkdir --parents /etc/systemd/logind.conf.d

cat <<EOT >> /etc/systemd/logind.conf.d/lid_sleep.conf
[Login]
HandleLidSwitch=suspend
EOT

[Login]
HandleLidSwitch=suspend

mkdir --parents /etc/NetworkManager/conf.d
cat <<EOT >> /etc/NetworkManager/conf.d/wifi_rand_mac.conf
[device-mac-randomization]
wifi.scan-rand-mac-address=yes

[connection-mac-randomization]
ethernet.cloned-mac-address=random
wifi.cloned-mac-address=random
EOT


# multithread makepkg
cores=$(nproc)
echo "MAKEFLAGS=\"-j$cores --load-average=$cores\"" >> /etc/makepkg.conf

# user stuff
cp -R ${BASEDIR}/.config/ /home/"$USER"/.config/
cp -R ${BASEDIR}/.scripts/ /home/"$USER"/.scripts/
cp -R ${BASEDIR}/.zshrc /home/"$USER"/.zshrc
cp -R ${BASEDIR}/.zshenv /home/"$USER"/.zshenv
cp -R ${BASEDIR}/.texmf /home/"$USER"/.texmf/

cp -R ${BASEDIR}/.fonts /home/"$USER"/.fonts

mkdir --parents /home/"$USER"/.scripts/wallpaper
cp -R ${BASEDIR}/wallpapers /home/"$USER"/.scripts/wallpaper/wallpapers

mkdir --parents /etc/sddm.conf.d
mkdir --parents /usr/share/sddm/themes/

cp ${BASEDIR}/.sddm/sddm.conf /etc/sddm.conf.d/sddm.conf

# power
systemctl enable tlp.service
systemctl enable NetworkManager-dispatcher.service
systemctl mask systemd-rfkill.service systemd-rfkill.socket

# papirus folders
papirus-folders -C pink --theme Papirus

source sync.sh

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

cd /home/"$USER"/.scripts/

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
