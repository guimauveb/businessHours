import json
import datetime

from flask import Flask, flash, jsonify, redirect, url_for, render_template
from flask import request, session, Markup, send_from_directory

from flask_wtf.csrf import generate_csrf

from werkzeug import secure_filename
from werkzeug.urls import url_parse

import MySQLdb

from tempfile import mkdtemp
from config import Config
from __init__ import application
from __date_time__ import Date

from helpers import toReadableTime, formatHourPair, formatHour

@application.after_request
def after_request(response):

    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'

    return response

@application.route('/', methods=["GET", "POST"])
def index():

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()
    query = """SELECT * FROM days;"""
    cursor.execute(query)
    statuses = cursor.fetchall()

    dbEndpointsJSON = json.dumps(
                                 {
                                    "getDayStatus": url_for("getDayStatus"),
                                    "getOpenHours": url_for("getOpenHours"), 
                                    "markDayAsOpen": url_for("markDayAsOpen"), 
                                    "markDayAsClosed": url_for("markDayAsClosed"),
                                    "markAsHolidays": url_for("markAsHolidays"),
                                    "markAsOpenForBus": url_for("markAsOpenForBus"),
                                    "addHours": url_for("addHours"),
                                    "updateHours": url_for("updateHours"), 
                                    "deleteHours": url_for("deleteHours"),
                                    "getHourPairId": url_for("getHourPairId")
                                 }
                                )

    # hours are stored under a format corresponding to the number of minutes elapsed since sunday 00:00
    # to make error checking easier
    days = []

    for d, i in zip(statuses, range(len(statuses))):
        days.append({})

        # Retreive hours for each day
        query = """SELECT * FROM """ + d[1] + """ ORDER BY OpenH;"""
        cursor.execute(query)
        hours = cursor.fetchall()

        days[i]["day"]     = d[1]                   # monday, tuesday ...
        days[i]["status"]  = d[2]                   # Open / Closed
        days[i]["hours"]   = [{"id": h[0], "openHour": h[1], "closeHour": h[2]} for h in hours]     # Actual busines hours


    query = """SELECT * FROM holidays WHERE day = %s;"""
    cursor.execute(query, ("holidays",))
    holidays = cursor.fetchone()[2]

    cursor.close()
    db.close()

    serverTime = {"time": Date.elapsedMinTime(), "day": Date.day(), "dayDate": Date.dayDate(), "month": Date.month()}

    # Hours are then converted to a human readable format to be displayed in the table
    readableTime = toReadableTime(days)

    return render_template('index.html', 
            dbEndpointsJSON=dbEndpointsJSON, 
            days=json.dumps(days),
            holidays=holidays,
            readableTime=readableTime,
            serverTime=json.dumps(serverTime)
            )

@application.route('/getDayStatus', methods=["POST"])
def getDayStatus():

    day = request.json["day"]

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()
    query = "SELECT Open FROM days WHERE day = %s;"
    cursor.execute(query, (day,))

    status = cursor.fetchone()[0]

    return jsonify({"status": status})


@application.route('/getOpenHours', methods=["POST"])
def getOpenHours():

    day = request.json["day"]
    # If readable == true -> return under readable format, otherwise return under minute elapsed fomat
    readable = request.json["readable"]
    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )

    cursor = db.cursor()
    query = "SELECT * FROM {day} ORDER BY OpenH;".format(day=day)
    cursor.execute(query)
    hours = cursor.fetchall()

    cursor.close()
    db.close()

    tmp = []

    for h in hours:
        if readable:
            tmp.append(formatHourPair(day, {"div": day + "-h-p-" + str(h[0]), "id": h[0], "openHour": h[1], "closeHour": h[2]}))
        else:
            tmp.append({"div": day + "-h-p-" + str(h[0]), "id": h[0], "openHour": h[1], "closeHour": h[2]})


    if len(tmp) == 0:
        tmp = None

    return jsonify(tmp)


@application.route('/markDayAsOpen', methods=["POST"])
def markDayAsOpen():

    days = request.json["daysToOpen"]
    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()
    for day, value in days.items():
        if value == True:
            query = """UPDATE days
                    SET Open = %s
                    WHERE Day = %s;
                    """
            cursor.execute(query, (True, day))

    cursor.close()
    db.close()

    return jsonify("{} successfully marked as open.".format(days))

@application.route('/markDayAsClosed', methods=["POST"])
def markDayAsClosed():

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()
    days = request.json["daysToClose"]

    for day, value in days.items():
        if value == True:
            query = """UPDATE days
                    SET Open = %s
                    WHERE Day = %s;
                    """
            cursor.execute(query, (False, day))

    cursor.close()
    db.close()

    return jsonify("{} marked as closed.".format(days))

@application.route('/markAsHolidays', methods=["POST"])
def markAsHolidays():

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()

    query = """SELECT * FROM days;"""
    cursor.execute(query, ())
    days = cursor.fetchall()

    # Set holiday status to true
    query = """UPDATE holidays
                SET status = %s
                WHERE day = %s;"""
    cursor.execute(query, (True, "holidays"))

    for day in days:
        query = """UPDATE holidays
                    SET status = %s
                    WHERE id = %s;"""
        cursor.execute(query, (day[2], day[0]))
        # After saving its current status, set the day to closed
        query = """UPDATE days
                SET Open = %s
                WHERE Day = %s;
                """
        cursor.execute(query, (False, day[1]))


    cursor.close()
    db.close()

    return jsonify("Mode vacances activé.")

@application.route('/markAsOpenForBus', methods=["POST"])
def markAsOpenForBus():

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()

    query = """SELECT * FROM holidays;"""

    cursor.execute(query, ())
    days = cursor.fetchall()

    # Dismiss "holidays" which is the first entry of the db
    days = days[1:]

    for day in days:
        query = """UPDATE days
                    SET Open = %s
                    WHERE id = %s;"""
        cursor.execute(query, (day[2], day[0]))

    # Set holiday status to false
    query = """UPDATE holidays
                SET status = %s
                WHERE day = %s;"""
    cursor.execute(query, (False, "holidays"))

    cursor.close()
    db.close()

    return jsonify("Ouvert.")

@application.route('/addHours', methods=["POST"])
def addHours():

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()

    if len(request.json["hoursToAdd"]["monday"]) > 0:
        for pair in request.json["hoursToAdd"]["monday"]:
            query = """INSERT INTO monday
               (OpenH, CloseH)
                VALUES(%s, %s)"""
            cursor.execute(query, (pair["openHour"], pair["closeHour"]))

    if len(request.json["hoursToAdd"]["tuesday"]) > 0:
        for pair in request.json["hoursToAdd"]["tuesday"]:
            query = """INSERT INTO tuesday
               (OpenH, CloseH)
                VALUES(%s, %s)"""
            cursor.execute(query, (pair["openHour"], pair["closeHour"]))

    if len(request.json["hoursToAdd"]["wednesday"]) > 0:
        for pair in request.json["hoursToAdd"]["wednesday"]:
            query = """INSERT INTO wednesday
               (OpenH, CloseH)
                VALUES(%s, %s)"""
            cursor.execute(query, (pair["openHour"], pair["closeHour"]))

    if len(request.json["hoursToAdd"]["thursday"]) > 0:
        for pair in request.json["hoursToAdd"]["thursday"]:
            query = """INSERT INTO thursday
               (OpenH, CloseH)
                VALUES(%s, %s)"""
            cursor.execute(query, (pair["openHour"], pair["closeHour"]))

    if len(request.json["hoursToAdd"]["friday"]) > 0:
        for pair in request.json["hoursToAdd"]["friday"]:
            query = """INSERT INTO friday
               (OpenH, CloseH)
                VALUES(%s, %s)"""
            cursor.execute(query, (pair["openHour"], pair["closeHour"]))

    if len(request.json["hoursToAdd"]["saturday"]) > 0:
        for pair in request.json["hoursToAdd"]["saturday"]:
            query = """INSERT INTO saturday
               (OpenH, CloseH)
                VALUES(%s, %s)"""
            cursor.execute(query, (pair["openHour"], pair["closeHour"]))

    if len(request.json["hoursToAdd"]["sunday"]) > 0:
        for pair in request.json["hoursToAdd"]["sunday"]:
            query = """INSERT INTO sunday
               (OpenH, CloseH)
                VALUES(%s, %s)"""
            cursor.execute(query, (pair["openHour"], pair["closeHour"]))    

    cursor.close()
    db.close()

    return jsonify("Hour added.")


@application.route('/updateHours', methods=["POST"])
def updateHours():

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()

   
    if len(request.json["hoursToUpdate"]["monday"]) > 0:
        for pair in request.json["hoursToUpdate"]["monday"]:
            query =    """UPDATE monday
                   SET OpenH = %s,
                       CloseH = %s
                   WHERE id = %s;
            """
            cursor.execute(query, (pair["openHour"], pair["closeHour"], pair["id"]))

    if len(request.json["hoursToUpdate"]["tuesday"]) > 0:
        for pair in request.json["hoursToUpdate"]["tuesday"]:
            query =    """UPDATE tuesday
                   SET OpenH = %s,
                       CloseH = %s
                   WHERE id = %s;
            """
            cursor.execute(query, (pair["openHour"], pair["closeHour"], pair["id"]))

    if len(request.json["hoursToUpdate"]["wednesday"]) > 0:
        for pair in request.json["hoursToUpdate"]["wednesday"]:
            query =    """UPDATE wednesday
                   SET OpenH = %s,
                       CloseH = %s
                   WHERE id = %s;
            """
            cursor.execute(query, (pair["openHour"], pair["closeHour"], pair["id"]))

    if len(request.json["hoursToUpdate"]["thursday"]) > 0:
        for pair in request.json["hoursToUpdate"]["thursday"]:
            query =    """UPDATE thursday
                   SET OpenH = %s,
                       CloseH = %s
                   WHERE id = %s;
            """
            cursor.execute(query, (pair["openHour"], pair["closeHour"], pair["id"]))

    if len(request.json["hoursToUpdate"]["friday"]) > 0:
        for pair in request.json["hoursToUpdate"]["friday"]:
            query =    """UPDATE friday
                   SET OpenH = %s,
                       CloseH = %s
                   WHERE id = %s;
            """
            cursor.execute(query, (pair["openHour"], pair["closeHour"], pair["id"]))

    if len(request.json["hoursToUpdate"]["saturday"]) > 0:
        for pair in request.json["hoursToUpdate"]["saturday"]:
            query =    """UPDATE saturday
                   SET OpenH = %s,
                       CloseH = %s
                   WHERE id = %s;
            """

            cursor.execute(query, (pair["openHour"], pair["closeHour"], pair["id"]))

    if len(request.json["hoursToUpdate"]["sunday"]) > 0:
        for pair in request.json["hoursToUpdate"]["sunday"]:
            query =    """UPDATE sunday
                   SET OpenH = %s,
                       CloseH = %s
                   WHERE id = %s;
            """

    cursor.close()
    db.close()

    return jsonify("Update successful.")

@application.route('/deleteHours', methods=["POST"])
def deleteHours():

    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()
    if len(request.json["hoursToDelete"]["monday"]) > 0:
        for pair in request.json["hoursToDelete"]["monday"]:
            query = "DELETE FROM monday WHERE id = %s;"
            cursor.execute(query, (pair["id"],))

    if len(request.json["hoursToDelete"]["tuesday"]) > 0:
        for pair in request.json["hoursToDelete"]["tuesday"]:
            query = """DELETE FROM tuesday WHERE id = %s;"""
            cursor.execute(query, (pair["id"],))

    if len(request.json["hoursToDelete"]["wednesday"]) > 0:
        for pair in request.json["hoursToDelete"]["wednesday"]:
            query = """DELETE FROM wednesday WHERE id = %s;"""
            cursor.execute(query, (pair["id"],))

    if len(request.json["hoursToDelete"]["thursday"]) > 0:
        for pair in request.json["hoursToDelete"]["thursday"]:
            query = """DELETE FROM thursday WHERE id = %s;"""
            cursor.execute(query, (pair["id"],))

    if len(request.json["hoursToDelete"]["friday"]) > 0:
        for pair in request.json["hoursToDelete"]["friday"]:
            query = """DELETE FROM friday WHERE id = %s;"""
            cursor.execute(query, (pair["id"],))

    if len(request.json["hoursToDelete"]["saturday"]) > 0:
        for pair in request.json["hoursToDelete"]["saturday"]:
            query = """DELETE FROM saturday WHERE id = %s;"""
            cursor.execute(query, (pair["id"],))

    if len(request.json["hoursToDelete"]["sunday"]) > 0:
        for pair in request.json["hoursToDelete"]["sunday"]:
            query = """DELETE FROM sunday WHERE id = %s;"""
            cursor.execute(query, (pair["id"],))

    cursor.close()
    db.close()

    return jsonify("Deletion successfully completed.")

# Returns the last hour pair ID from the db to generate a new hour pair div on the webpage
@application.route('/getHourPairId', methods=["POST"])
def getHourPairId():

    day = request.json["day"]
    db = MySQLdb.connect(host="",
            port=3306,
            user="",
            passwd="",
            db="",
            autocommit=True,
            use_unicode=True
            )
    cursor = db.cursor()

    query = "SELECT MAX(id) FROM {day}".format(day=day)
    cursor.execute(query)

    hour_id = cursor.fetchone()[0]

    cursor.close()
    db.close()

    return jsonify(hour_id)

