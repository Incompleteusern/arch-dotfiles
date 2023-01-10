#!/bin/bash

BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# INSTALLATION

# CONFIG

# Add colors to /etc/pacman.conf 
sed -i "s/#Color/Color" /etc/pacman.conf
# cat ILoveCandy >> /etc/pacman.conf

# .config
ln -s ${BASEDIR}/config ~/.config

# DESKTOP

# hyprland
yay -S --noconfirm hyprland-git dunst waybar-hyprland-git

# pipewire
yay -S --noconfirm pipewire pipewire-jack wireplumber

# UTILITIES

# APPLICATIONS

# firefox - prefer pipewire-jack by earlier
yay -S --noconfirm firefox

