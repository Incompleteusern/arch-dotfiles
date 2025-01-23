BASEDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Remove old
rm -rf ${BASEDIR}/.config
rm -rf ${BASEDIR}/.scripts
rm -rf ${BASEDIR}/.zshrc

mkdir ${BASEDIR}/.config

# Copy files
cp -r ~/.config/alacritty ${BASEDIR}/.config/
cp -r ~/.config/dunst ${BASEDIR}/.config/
cp -r ~/.config/hypr ${BASEDIR}/.config/
cp -r ~/.config/rofi ${BASEDIR}/.config/
cp -r ~/.config/cava ${BASEDIR}/.config/
cp -r ~/.config/rofi ${BASEDIR}/.config/
cp -r ~/.config/neofetch ${BASEDIR}/.config/
cp -r ~/.config/networkmanager-dmenu ${BASEDIR}/.config/
cp -r ~/.config/eww ${BASEDIR}/.config/
cp -r ~/.config/fcitx5 ${BASEDIR}/.config/
cp -r ~/.config/htop ${BASEDIR}/.config/
cp -r ~/.config/lazygit ${BASEDIR}/.config/
cp -r ~/.texmf ${BASEDIR}/
cp -r  ~/.scripts/ ${BASEDIR}/
cp -r  ~/.fonts ${BASEDIR}/

cp ~/.zshenv ${BASEDIR}/
cp  ~/.zshrc ${BASEDIR}/

cp  /etc/sddm.conf.d/sddm.conf ${BASEDIR}/.sddm
cp  /etc/xdg/reflector/reflector.conf ${BASEDIR}/

cp -r ~/.scripts/wallpaper/wallpapers ${BASEDIR}/
