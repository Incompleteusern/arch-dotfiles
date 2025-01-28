#!/bin/sh

status="$(cat /sys/class/power_supply/BAT0/status)"
level="$(cat /sys/class/power_supply/BAT0/capacity)"

if [[ ("$status" == "Discharging") || ("$status" == "Full") ]]; then
  if [[ "$level" -eq "0" ]]; then
    printf "$level%% 󰂎"
  elif [[ ("$level" -le "10") ]]; then
    printf "$level%% 󰁺"
  elif [[ ("$level" -le "20") ]]; then
    printf "$level%% 󰁻"
  elif [[ ("$level" -le "30") ]]; then
    printf "$level%% 󰁼"
  elif [[ ("$level" -le "40") ]]; then
    printf "$level%% 󰁽"
  elif [[ ("$level" -le "50") ]]; then
    printf "$level%% 󰁾"
  elif [[ ("$level" -le "60") ]]; then
    printf "$level%% 󰁿"
  elif [[ ("$level" -le "70") ]]; then
    printf "$level%% 󰂀"
  elif [[ ("$level" -le "80") ]]; then
    printf "$level%% 󰂁"
  elif [[ ("$level" -le "90") ]]; then
    printf "$level%% 󰂂"  
  else
    printf "$level%% 󰁹 "

  fi
elif [[ "$status" == "Charging" ]]; then
  printf "$level%% 󰂄"
fi
