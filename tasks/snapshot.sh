#!/bin/bash



if [ ! -f $1.png ]
then
    FILENAME=$1.png
else
    i=1
    while [ -f $1.$i.png ]
    do
        i=$i + 1
    done
    FILENAME=$1.$i.png
fi

echo $FILENAME

adb shell screencap -p /sdcard/$1.png
adb pull /sdcard/$1.png $1.png
adb shell rm /sdcard/$1.png


