# returns hours under a human readable format -> 23:23
def toReadableTime(days):

    readableTime = []

    for d, i in zip(days, range(len(days))):
        readableTime.append({"day": d["day"], "status": d["status"]})
        readableTime[i]["hours"] = []
        for hp in d["hours"]:
            readableTime[i]["hours"].append(formatHourPair(d["day"], hp))

    return readableTime


# takes day and an hour pair to determine if a closing hour is at d + 1
def formatHourPair(d, hp):
    dic = {}
    # Then we want the full hours and the minutes returned as the remainder
    dic["id"] = hp["id"]

    # we do the same thing for both opening and closing hour 
    dic["openHour"] = formatHour(d, hp["openHour"])
    dic["closeHour"] = formatHour(d, hp["closeHour"])

    return dic


def formatHour(d, time):

    # we'll determine if a closing hour for day d is actually in d + 1 range
   dayRange = {
           "sunday":    [0, 1439],
           "monday":    [1440, 2879],
           "tuesday":   [2880, 4319],
           "wednesday": [4320, 5759],
           "thursday":  [5760, 7199],
           "friday":    [7200, 8639],
           "saturday":  [8640, 10079]
           }

   # if closing hour is d + 1
   if time > dayRange[d][1]:
       # substract the corresponding number of days to only keep the hours above 00:00 
       time -= dayRange[d][0]

   # We divide by 1440 to get rid of full day and only keep minutes since the current day
   time = time % 1440

   hours = time // 60
   minutes = time % 60

   if hours < 10:
       hours = "0" + str(hours)
   else:
       hours = str(hours)
   if minutes < 10:
       minutes = "0" + str(minutes)
   else:
       minutes = str(minutes)

   return hours + ":" + minutes


