serial.setBaudRate(BaudRate.BaudRate115200)
Brickcell.setDate(2, 10, 10, 2023)
Brickcell.setTime(8, 6, 0)
basic.forever(function () {
    serial.writeLine(Brickcell.getDate())
    serial.writeLine(Brickcell.getTime())
    serial.writeLine("")
    basic.pause(2000)
})
