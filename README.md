This is a work in progress.

# Allegiances

- Window Manager: `Hyprland`
- Text Editor: a mess really, vscode and jetbrains and nvim are all good except for I am too lazy for nvim
- Color Scheme: `catppuccin`
- More allegiances to come in the future :|.

# Pre-installation

This has the arch install guide as a reference as well as https://jpetazzo.github.io/2024/02/23/archlinux-luks-tpm-secureboot-install/
https://github.com/joelmathewthomas/archinstall-luks2-lvm2-secureboot-tpm2
https://gist.github.com/michaelb081988/0e3f1bbd3bb04fb34c0726e28da2a934
https://gist.github.com/orhun/02102b3af3acfdaf9a5a2164bea7c3d6#mount-efi-partition


## Partitioning

|  Partition | Size  | fdisk Type  | PARTLABEL |  File System |
| ------------ | ------------ | ------------ |  ------------ |  ------------ |
| EFI System | N/A  | N/A | EFI | N/A |
| Linux Extended Boot | 1 GB  | xbootldr | boot | fat32 |
| Linux Partition | Remainder  | fd | cryptlvm | volume |

* Make partitions with fdisk or cfdisk, and label them with gdisk
* I am dual booting so an EFI file system exists already which I will use and not touch with a ten foot pole, so this is why we have an extended boot partition.
* I am an idiot and I also want to try about btrfs so this goes hand in hand

## Filesystems

This is roughly isomorphic to https://wiki.archlinux.org/title/Dm-crypt/Encrypting_an_entire_system#LVM_on_LUKS and merges a few others:

We first overrwrite the Linux Partition with random data:
```bash
dd if=/dev/urandom of=/dev/nvme0n1pN bs=1M status=progress
```
where `of` is the desired disk step (this is optional), double check that `of` is correct or you will be very unhappy. Now, we set up the btrfs file system.
```bash
cryptsetup benchmark # benchmark cryptsetup

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
We then make our file systems (make an EFS separately if you need to)
```bash
mkfs.ext4 /dev/VolGroup/root
mkfs.ext4 /dev/VolGroup/home
mkswap /dev/VolGroup/swap
mkfs.vfat -n boot /dev/disk/by-partlabel/boot
```
and then mount them
```bash
mount /dev/VolGroup/root /mnt
mount --mkdir /dev/VolGroup/home /mnt/home
swapon /dev/VolGroup/swap
mount --mkdir -o uid=0,gid=0,fmask=0077,dmask=0077 /dev/disk/by-partlabel/EFI /mnt/efi
mount --mkdir -o uid=0,gid=0,fmask=0077,dmask=0077 /dev/disk/by-partlabel/boot /mnt/boot
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
genfstab -L /mnt >> /mnt/etc/fstab # -U also works
```
We can now arch chroot and follow the arch wiki's steps pretty bat for bat
```bash
arch-chroot /mnt
ln -sf /usr/share/zoneinfo/Region/City /etc/localtime 
hwclock --systohc
locale-gen
nano /etc/locale.conf
nano /etc/vconsole.conf
nano /etc/hostname

passwd
useradd -m newuser
passwd newuser

nano /etc/sudoers
visudo
usermod -G wheel newuser
```

##  Booting

We use `systemd-boot` so let us install that
```bash
bootctl install --boot-path=/boot --esp-path=/efi # omit arguments if no extended boot dir
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
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt lvm2 filesystems fsck)
```
adding `systemd, keyboard, sd-vconsole, sd-encrypt, lvm2` where `sd-vconsole` is optional if you aren't using standard `/etc/vconsole.conf`.

We can now generate initcpio:
```bash
mkinitcpio --allpresets
```
and create a basic `<ESP>/loader/entries/arch.conf`
```
title Arch Linux
linux /vmlinuz-linux
initrd /initramfs-linux.img
options rd.luks.name=<DEVICE-UUID>=lvm root=/dev/VolGroup/root rw
```
(Though by virtue of [automounting](https://wiki.archlinux.org/title/Systemd#GPT_partition_automounting), specifying the root and resume may be unnecessary).

Finally, run `mkinitcpio --allpresets` and we should be all good for now. Rebooting here is possible.

# Post-Installation

## Unified Kernel Image

Some actual things for `/etc/cmdline.d/root.conf`:
```bash
rd.luks.name=<DEVICE-UUID>=lvm root=/dev/VolGroup/root resume=/dev/VolGroup/swap rw splash acpi_backlight=vendor audit=0 quiet
```

Edit `/etc/mkinitcpio.d/linux.preset` uncommenting the default_uki and fallback_uki options, storing things in /boot preferably.

Now `arch.conf` is unnecessary. Rebuild `mkinitcpio --allpresets`.

## Secure Boot

Before this, disable secure boot / put it in setup mode.

Install `pacman -S sbctl sbsigntools` and then ensure `sbctl status` outputs `Setup Mode` as enabled.

Then create signing keys and enroll them
```bash
sbctl create-keys
sbctl enroll-keys --microsoft # needed for dual booting
sbctl verify
sbctl sign -s <file> # for each of the earlier files, microsoft not being signed is fine. -s creates a hook for signing this file
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
# /usr/lib/systemd/systemd-cryptsetup attach lvm /dev/disk/by-partlabel/cryptlvm - tpm2-device=auto # test if it works
# systemd-cryptenroll /dev/disk/by-partlabel/cryptlvm --wipe-slot=password # wipe the password if necessary
```
Afterwards, add `rd.luks.options=<DEVICE-UUID>=tpm2-device=auto` to the entries to avoid entering the password again (editting `crypttab.initramfs` is an alternative).

If any early kernel modules are needed, add it to `MODULES=(tpm_tis)` and run mkinitcpio again.

If the state of secure boot or firmware changes, running
```bash
systemd-cryptenroll --wipe-slot=tpm2 /dev/disk/by-partlabel/cryptlvm --tpm2-pcrs=0+7
```
wipes the slot which allows for it to be re-enrolled.

## TODO

timesyncd, swapfile, boot change protections, allow for dm specialties ssd things, look into chkboot
https://wiki.archlinux.org/title/Dm-crypt/Specialties#Disable_workqueue_for_increased_solid_state_drive_(SSD)_performance
and also the other one.
check if swap partition works haha.
