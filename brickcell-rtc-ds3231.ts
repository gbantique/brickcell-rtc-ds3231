enum daysOfTheWeek {
    //% block="Sunday"
    Sunday = 1,
    //% block="Monday"
    Monday = 2,
    //% block="Tuesday"
    Tuesday = 3,
    //% block="Wednesday"
    Wednesday = 4,
    //% block="Thursday"
    Thursday = 5,
    //% block="Friday"
    Friday = 6,
    //% block="Saturday"
    Saturday = 7
}


//% color="#FFBF00" icon="\uf12e" weight=70
namespace Brickcell {


    const DS3231_I2C_ADDR = 0x68

    // Timekeeing Registers

    const DS3231_SECONDS = 0x00
    const DS3231_MINUTES = 0x01
    const DS3231_HOURS = 0x02
    const DS3231_WEEKDAY = 0x03
    const DS3231_DAY = 0x04
    const DS3231_MONTH = 0x05
    const DS3231_YEAR = 0x06

    const DS3231_A1_SECONDS = 0x07
    const DS3231_A1_MINUTES = 0x08
    const DS3231_A1_HOURS = 0x09
    const DS3231_A1_DAY_DATA = 0x0A

    const DS3231_A2_MINUTES = 0x0B
    const DS3231_A2_HOURS = 0x0C
    const DS3231_A2_DAY_DATA = 0x0D

    const DS3231_CONTROL_ADDR = 0x0E
    const DS3231_STATUS_ADDR = 0x0F

    const DS3231_AGING_OFFSET = 0x10
    const DS3231_MSB_TEMP = 0x11
    const DS3231_LSB_TEMP = 0x12


    function DS3231_init() {
        let buffer = pins.createBuffer(2)
        buffer[0] = DS3231_CONTROL_ADDR
        buffer[1] = 0x4C
        pins.i2cWriteBuffer(DS3231_I2C_ADDR, buffer)
    }

    DS3231_init()
    setStatus(0x08)


    /**
     * decToHexString
     *
     * https://stackoverflow.com/questions/50967455/from-decimal-to-hexadecimal-without-tostring
     */
    function decToHexString(int: number, base: number): string {
        let letters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        let returnVal = "";
        if (base > 1 && base < 37) {
            while (int != 0) {
                let rest = int % base;
                int = Math.floor(int / base);
                returnVal = letters[rest] + returnVal;
            }
        }
        return returnVal;
    }

    function decToBcd(value: number): number {
        return (Math.floor(value / 10) << 4) + (value % 10)
    }

    function bcdToDec(value: number): number {
        return Math.floor(value / 16) * 10 + (value % 16)
    }

    function getRegister(register: number): number {
        let data = pins.createBuffer(1)
        data[0] = register
        pins.i2cWriteBuffer(DS3231_I2C_ADDR, data)
        return pins.i2cReadNumber(DS3231_I2C_ADDR, NumberFormat.UInt8LE)
    }

    function setRegister(register: number, value: number) {
        let data = pins.createBuffer(2)
        data[0] = register
        data[1] = value
        pins.i2cWriteBuffer(DS3231_I2C_ADDR, data)
    }

    // ==========================================================================
    // Export Functions.
    // ==========================================================================

    /**
     * setTime
     */
    //% block="Set time:|hour: $hour mins: $mins secs: $secs"
    //% hour.min=0 hour.max=23 mins.min=0 mins.max=59 secs.min=0 secs.max=59
    //% weight=120
    //% subcategory="rtc ds3231"
    export function setTime(hour: number, mins: number, secs: number) {
        if (hour >= 0 && hour <= 23 && mins >= 0 && mins <= 59 && secs >= 0 && secs <= 59) {
            setRegister(DS3231_HOURS, decToBcd(hour))
            setRegister(DS3231_MINUTES, decToBcd(mins))
            setRegister(DS3231_SECONDS, decToBcd(secs))
        }
    }

    /**
     * setDate
     */
    //% block="Set date:|year $year month $month day $day weekday $weekday"
    //% inlineInputMode=inline
    //% weekday.min=1 weekday.max=7 day.min=1 day.max=31 month.min=1 month.max=12 year.min=2000 year.max=2100
    //% weight=119
    //% subcategory="rtc ds3231"
    export function setDate(weekday: number, day: number, month: number, year: number) {
        if (weekday >= 0 && weekday <= 7 && day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year < 2100) {
            setRegister(DS3231_WEEKDAY, weekday)
            setRegister(DS3231_DAY, day)
            setRegister(DS3231_MONTH, month)
            setRegister(DS3231_YEAR, year - 2000)
        }
    }

    /**
     * getTime
     */
    //% block="getTime (string)"
    //% weight=118
    //% subcategory="rtc ds3231"
    export function getTime(): string {
        let hour = bcdToDec(getRegister(DS3231_HOURS))
        let mins = bcdToDec(getRegister(DS3231_MINUTES))
        let secs = bcdToDec(getRegister(DS3231_SECONDS))
        let t: string = "" + ((hour / 10) >> 0) + hour % 10 + ":" + ((mins / 10) >> 0) + mins % 10 + ":" + ((secs / 10) >> 0) + secs % 10
        return t
    }

    /**
     * getDate
     */
    //% block="getDate (string)"
    //% weight=117
    //% subcategory="rtc ds3231"
    export function getDate(): string {
        let day = getRegister(DS3231_DAY)
        let month = getRegister(DS3231_MONTH) & 0x1F
        let year = getRegister(DS3231_YEAR) + 2000
        return `${year}:${month}:${day}`
    }

    /**
     * alarm1
     */
    //% block="set alarm1:|hour $hour mins $mins secs $secs"
    //% hour.min=0 hour.max=23 mins.min=0 mins.max=59 secs.min=0 secs.max=59
    //% weight=116
    //% subcategory="rtc ds3231"
    export function alarm1(hour: number, mins: number, secs: number) {
        let ctrl = getRegister(DS3231_CONTROL_ADDR)
        if ((ctrl & 0x04) && hour >= 0 && hour <= 23 && mins >= 0 && mins <= 59 && secs >= 0 && secs <= 59) {
            setControl(0x4C)
            setRegister(DS3231_A1_HOURS, decToBcd(hour))
            setRegister(DS3231_A1_MINUTES, decToBcd(mins))
            setRegister(DS3231_A1_SECONDS, decToBcd(secs))
            setRegister(DS3231_A1_DAY_DATA, 0x80)
            setStatus(0x88)
            setControl(0x4D)
        }
    }


    /**
     * alarm2
     */
    //% block="set alarm2:|hour $hour mins $mins"
    //% hour.min=0 hour.max=23 mins.min=0 mins.max=59
    //% weight=115
    //% subcategory="rtc ds3231"
    export function alarm2(hour: number, mins: number) {
        let ctrl = getRegister(DS3231_CONTROL_ADDR)
        if ((ctrl & 0x04) && hour >= 0 && hour <= 23 && mins >= 0 && mins <= 59) {
            setControl(0x4C)
            setRegister(DS3231_A2_HOURS, decToBcd(hour))
            setRegister(DS3231_A2_MINUTES, decToBcd(mins))
            setRegister(DS3231_A2_DAY_DATA, 0x80)
            setStatus(0x88)
            setControl(0x4E)
        }
    }

    /**
     * clear alarms
     */
    //% block="clear alarms"
    //% weight=114
    //% subcategory="rtc ds3231"
    export function clearAlarms() {
        setControl(0x4C)
    }



    /**
     * Seconds
     */
    //% block="seconds"
    //% weight=111
    //% subcategory="rtc ds3231"
    export function seconds(): number {
        return bcdToDec(getRegister(DS3231_SECONDS))
    }

    /**
     * Minutes
     */
    //% block="minutes"
    //% weight=112
    //% subcategory="rtc ds3231"
    export function minutes(): number {
        return bcdToDec(getRegister(DS3231_MINUTES))
    }

    /**
     * Hours
     */
    //% block="hours"
    //% weight=113
    //% subcategory="rtc ds3231"
    export function hours(): number {
        return bcdToDec(getRegister(DS3231_HOURS))
    }

    /**
     * Year
     */
    //% block="year"
    //% weight=110
    //% subcategory="rtc ds3231"
    export function year(): number {
        return getRegister(DS3231_YEAR) + 2000
    }

    /**
     * Month
     */
    //% block="month"
    //% weight=109
    //% subcategory="rtc ds3231"
    export function month(): number {
        return getRegister(DS3231_MONTH) & 0x1F
    }

    /**
     * Day
     */
    //% block="day"
    //% weight=108
    //% subcategory="rtc ds3231"
    export function day(): number {
        return getRegister(DS3231_DAY)
    }

    /**
     * WeekDay
     */
    //% block="week day"
    //% weight=107
    //% subcategory="rtc ds3231"
    export function weekday(): number {
        return getRegister(DS3231_WEEKDAY)
    }


    /**
     * temperature
     */
    //% block "temperature"
    //% weight=106
    //% subcategory="rtc ds3231"
    export function temperature(): number {
        let msb_temp = getRegister(DS3231_MSB_TEMP)
        let lsb_temp = getRegister(DS3231_LSB_TEMP)
        return msb_temp + (lsb_temp >> 6) * 0.25
    }





    // ==========================================================================
    // Advanced Export Functions
    // ==========================================================================

    /**
     * set control
     */
    export function setControl(value: number) {
        let buffer = pins.createBuffer(2)
        buffer[0] = DS3231_CONTROL_ADDR
        buffer[1] = value
        pins.i2cWriteBuffer(DS3231_I2C_ADDR, buffer)
    }

    /**
     * set status
     */
    export function setStatus(value: number) {
        let buffer = pins.createBuffer(2)
        buffer[0] = DS3231_STATUS_ADDR
        buffer[1] = value
        pins.i2cWriteBuffer(DS3231_I2C_ADDR, buffer)
    }

    /**
     * control
     */
    export function control(): number {
        let ctrl = getRegister(DS3231_CONTROL_ADDR)
        return ctrl
    }

    /**
     * status
     */
    export function status(): number {
        let status = getRegister(DS3231_STATUS_ADDR)
        return status
    }


    /**
     * hexString
     */
    export function hexString(value: number): string {
        return decToHexString(value, 16)
    }

    /**
     * binaryString
     */
    export function binaryString(value: number): string {
        return decToHexString(value, 2)
    }

    /**
     * decimalString
     */
    export function decimalString(value: number): string {
        return decToHexString(value, 10)
    }

}

// Original: https://github.com/AlexandreFrolov/DS3231/