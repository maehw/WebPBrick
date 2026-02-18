;
; first.s
;
; A refined version of the first piece of firmware that I wrote completely
; from scratch.
;
; Kekoa Proudfoot
; 10/29/98
;


                .lsym    clear_memory, 0x0436
                .lsym    init_buttons, 0x1aba
                .lsym    set_lcd_segment, 0x1b62
                .lsym    clear_display, 0x27ac
                .lsym    refresh_display, 0x27c8
                .lsym    init_power, 0x2964
                .lsym    play_power_sound, 0x299a
                .lsym    get_on_off_key_state, 0x29f2
                .lsym    power_off, 0x2a62
                .lsym    set_firmware, 0x3b9a
                .lsym    get_sound_queue_length, 0x3ccc
                .global  _start

_start:
                mov.w    r0,@-r7
                mov.w    r1,@-r7
                mov.w    r2,@-r7
                mov.w    r3,@-r7
                mov.w    r4,@-r7
                mov.w    r5,@-r7
                mov.w    r6,@-r7

                subs     #0x2,r7

                mov.w    #0xc000,r0
                mov.w    #0xf000,r1
                jsr      clear_memory

                mov.w    @0x0:16,r6
                mov.w    r6,@0xfd90:16

power_on:
                mov.w    #0xc000,r6
                mov.w    r6,@-r7
                mov.w    #0xc006,r6
                jsr      set_firmware
                adds     #0x2,r7

                jsr      init_power

                mov.w    #0x3020,r6
                jsr      set_lcd_segment
                jsr      refresh_display

                mov.w    #0x1,r6
                mov.w    r6,@-r7
                mov.w    #0x4003,r6
                jsr      play_power_sound
                adds     #0x2,r7

wait_release:
                mov.w    r7,r6
                mov.w    r6,@-r7
                mov.w    #0x4000,r6
                jsr      get_on_off_key_state
                adds     #0x2,r7

                mov.w    @r7,r6
                beq      wait_release

wait_press:
                mov.w    r7,r6
                mov.w    r6,@-r7
                mov.w    #0x4000,r6
                jsr      get_on_off_key_state
                adds     #0x2,r7

                mov.w    @r7,r6
                bne      wait_press

                mov.w    #0x0,r6
                mov.w    r6,@-r7
                mov.w    #0x4003,r6
                jsr      play_power_sound
                adds     #0x2,r7

wait_sound:
                mov.w    r7,r6
                mov.w    r6,@-r7
                mov.w    #0x700c,r6
                jsr      get_sound_queue_length
                adds     #0x2,r7

                mov.w    @r7,r6
                bne      wait_sound

                jsr      clear_display
                jsr      refresh_display

                jsr      power_off

                jmp      power_on

                .string  "Do you byte, when I knock?"

	        .org     0x4000

	
