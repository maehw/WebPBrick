# README

This folder and its subfolders contain firmware for the yellow programmable LEGO MINDSTORMS brick - the RCX. Some of these firmware files are property of someone else; probably LEGO, Inc. or Dick Swan.

They are provided here as a convenience only, as they can be found all over the internet.

Note that it is unknown if any of the "fast" firmwares work with any current version of NQC, as only the official LEGO firmwares have been tested. From [(Web)NQC's firmware README](https://github.com/maehw/WebNQC/blob/master/firmware/README.md):

* firm0309 - Original version shipped with RIS 1.0 and 1.5
* firm0328 - Shipped with RIS 2.0
* firm0332 - Released as part of the LEGO Education Robotics sets

> "Unless there is a compelling reason not to do so, you should just use the latest LEGO firmware (0332) for NQC, which can be used in any RCX brick from 1.0 on."

## Build firmware for WebPBrick

In order to use `.lgo` firmware files with WebPBrick, they need to be converted.

As a first step, convert it to a HEX dump in C include file ("header file") format using file using `srec_cat`:

```
srec_cat firm0328.lgo -offset -0x8000 -o firm0328.js -C-Array
```

To get JavaScript compatible code, finally replace the variable definition of this binary byte blob ...

```
const unsigned char eprom[] =
{
```

at the beginning of the file by ...

```
const firm0328Data = new Uint8Array(
[
```

And in the very end, replace ...

```
};
const unsigned long eprom_termination = 0x00000000;
const unsigned long eprom_start       = 0x00000000;
const unsigned long eprom_finish      = 0x00006170;
const unsigned long eprom_length      = 0x00006170;

#define EPROM_TERMINATION 0x00000000
#define EPROM_START       0x00000000
#define EPROM_FINISH      0x00006170
#define EPROM_LENGTH      0x00006170
```

by a simple ...

```
]);
```

to terminate the array (and remove the other preprocessor and constant definitions). Save the changes and you're done! :)
