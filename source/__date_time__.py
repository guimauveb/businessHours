# Use server time instead of client side time
from datetime import datetime
from pytz import timezone

tz = timezone('Europe/Paris')

class Date():

    def day():

        day = datetime.now(tz=tz).strftime('%A')
        return day

    def dayDate():

        day_date = datetime.now(tz=tz).strftime('%d')
        if int(day_date) < 10:
            return day_date[1]
        return day_date

    def month():

        month = datetime.now(tz=tz).strftime('%m')
        if month == '01':
            return 'January'
        elif month == '02':
            return 'February'
        elif month == '03':
            return 'March'
        elif month == '04':
            return 'April'
        elif month == '05':
            return 'May'
        elif month == '06':
            return 'June'
        elif month == '07':
            return 'July'
        elif month == '08':
            return 'August'
        elif month == '09':
            return 'September'
        elif month == '10':
            return 'October'
        elif month == '11':
            return 'November'
        elif month == '12':
            return 'December'

    def readableTime():
        hour = datetime.now(tz=tz).strftime('%H')
        minutes = datetime.now(tz=tz).strftime('%M')
        return(int)(hour+minutes)

    def elapsedMinTime():
        day = datetime.now(tz=tz).weekday()
        # Day index starts at monday == 0 in Python but JS day index starts at sunday == 0
        if day == 6:
            day = 0
        else:
            day += 1
        hour = datetime.now(tz=tz).hour
        minutes = datetime.now(tz=tz).minute

        ret =  (day * 1440) + (hour * 60) + minutes;

        return ret

