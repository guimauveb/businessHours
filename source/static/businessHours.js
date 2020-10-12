/* Wrap our app into a namespace */
var businessHours = {};
(function() {

    var endpointsURLs;
    var CSRFToken;
    var credentials;

    this.setEndpointsURLs = function(endpointsJSON) {
        endpointsURLs = JSON.parse(endpointsJSON);
    }

    this.setCSRFToken = function(token) {
        CSRFToken = token;
    }

    this.setCredentials = function(cred) {
        credentials = JSON.parse(cred);
    }

    /* Bools to signal if an action needs to be performed */
    var OPEN = false;
    var CLOSE = false;

    /* JSON containing the divs to get the hour pairs from when 'Apply' is clicked */
    var taDivs = {
        "actions": [
            /* add */
            {
                "sunday": [],
                "tuesday": [],
                "wednesday": [],
                "thursday": [],
                "friday": [],
                "saturday": [],
                "monday": []
            },
            /* update */
            {
                "sunday": [],
                "tuesday": [],
                "wednesday": [],
                "thursday": [],
                "friday": [],
                "saturday": [],
                "monday": []
            },
            /* delete */
            {
                "sunday": [],
                "tuesday": [],
                "wednesday": [],
                "thursday": [],
                "friday": [],
                "saturday": [],
                "monday": []
            }
        ]
    };

    var daysToClose = {
        "sunday": false,
        "tuesday": false,
        "wednesday": false,
        "thursday": false,
        "friday": false,
        "saturday": false,
        "monday": false
    };

    var daysToOpen = {
        "sunday": false,
        "tuesday": false,
        "wednesday": false,
        "thursday": false,
        "friday": false,
        "saturday": false,
        "monday": false
    };

    /* Remove the colon between hours and minutes and returns time as an int */
    this.removeColon = function(hour) {
        var index = 2;
        return hour.substring(0, index) + hour.substring(index + 1, hour.length);
    }

    /* Set the faulty div background-color to red for 300 ms */
    this.markDivAsFaulty = function(div) {
        var el = document.getElementById(div);
        el.style.transition = "1s";
        el.style.borderRadius = "6px";
        el.style.backgroundColor = "rgba(255, 77, 77, .9)";
        setTimeout(function() { el.style.backgroundColor = ""; }, 3000);

    }

    /* Returns a day index */
    this.getDayIndex = function(day) {
        if (day == "sunday")
            return 0;
        else if (day == "monday")
            return 1;
        else if (day == "tuesday")
            return 2;
        else if (day == "wednesday")
            return 3;
        else if (day == "thursday")
            return 4;
        else if (day == "friday")
            return 5;
        else if (day == "saturday")
            return 6;
        else {
            console.log("Invalid day value.");
            return null;
        }
    };

    /* Format an hour from an hour pair */
    this.formatHour = function(d, time, k) {
        var tmp = time[0] + time[1];
        var h = parseInt(this.removeColon(tmp));
        var ret = this.getDayIndex(d) * 1440 + h * 60;
        /* If closing hour of saturday is during sunday */ 
        return ret; 
    }

    this.formatMinutes = function(d, time, k) {
        var min = time[3] + time[4];
        return parseInt(min);
    }

    this.formatTime = function(d, h, k) {
        this.formatHour(d, h, k);
        this.formatMinutes(d, h, k);

        return this.formatHour(d, h, k) + this.formatMinutes(d, h, k);
    }

    /* Convert time from an hour pair */
    this.formatHourPair = function(d, hp) {
        var minutes;
        var openH = this.formatTime(d, hp["openHour"], "O");
        var closeH = this.formatTime(d, hp["closeHour"], "C");

        /* d + 1 */
        if (closeH < openH) {
            closeH += 1440;
        }

        if ((d == "saturday") && (closeH > 10079)) {
            closeH -= 10080;
        }

        return {"div": hp["div"], "id": hp["id"], "openHour": openH, "closeHour": closeH};
    }

    /* Convert time from 01:23 format to minutes elapsed since day 0 00:00 */
    this.convertToMinElapsed = function(hours, day) {

        var minElapsed = this.formatHourPair(day, hours);
        return minElapsed;
    }

    this.createHTMLAdd = function(day, dbHourPairId) {
        /* Select the day row */
        el = document.getElementById(day + '-hours');
        /* Append to the day div a new div containing a new hour pair */
        var newHours = document.createElement("div");
        newHours.className = "hour-pair-container";
        newHours.id = day + "-h-p-" + dbHourPairId;
        newHours.innerHTML =

            '<div class="day-hours" id="' + day  + '"style="grid-column: 2;">' +
            '<input class="time-input" id="appt-time-' + day + '-open-hour-' + dbHourPairId +
            '" type="time" step="900" name="appt-time-open-' + day + '-' + dbHourPairId +
            '" onclick="businessHours.updateRecorder(\'' + day + '\', ' +  dbHourPairId
            + ')" value="07:00">' +
            '</div>' +
            '<div class="day-hours" id="' + day + '" style="grid-column: 3;">' +
            '<input class="time-input" id="appt-time-' + day + '-close-hour-' + dbHourPairId +
            '" type="time" step="900" name="appt-time-close-' + day + '-' + dbHourPairId +
            '" onclick="businessHours.updateRecorder(\'' + day + '\', ' +  dbHourPairId +
            ')" value="07:00">';

        el.appendChild(newHours);

        /* Append a new delete button */
        newDelBtn = document.createElement("div");
        newDelBtn.className = 'del-hours';
        newDelBtn.id = day + '-hours-delete-' + dbHourPairId;
        newDelBtn.innerHTML =
            '<a class="" href="#!" onclick="businessHours.deleteRecorder(\'' + day + '\', \'' +
            dbHourPairId + '\')"><i class="fa fa-times"></i></a>';
        el.appendChild(newDelBtn);

        /* Append a new add button */
        const addBtn = document.getElementById('add-hours-' + day);
        el.appendChild(addBtn);
    };

    /* Remove hour pair from the markup */
    this.createHTMLDelete = function(day, hours) {
        hourPair = document.getElementById(day + '-h-p-' + hours);
        hourPair.remove();
        delButton = document.getElementById(day + '-hours-delete-' + hours);
        delButton.remove();
    };

    /* Set the day to 'closed' in the HTML page */
    this.createHTMLClosed = function(day) {
        dayHours = document.getElementById(day + '-hours');
        dayHours.innerHTML = '<div class="week-day-closed">Closed</div>';
    };

    /* Set the day to 'open' in the HTML page */
    this.createHTMLOpen = function(day, hours) {
        var el = document.getElementById(day + '-hours');
        el.innerHTML = '<div class="week-day-open">Open</div>';
        /* todo - add a pair of hour selector when 'add hours' is clicked */
        /* todo - restore last saved hours before day was marked as closed */
        for (k in hours) {
            el.innerHTML +=
                '<div class="hour-pair-container" id="' + day + '-h-p-' + hours[k].id + '">' +
                '<div class="day-hours" style="grid-column: 2;">' +
                '<input class="time-input" id="appt-time-' + day + '-open-hour-' + hours[k].id +
                '" type="time" step="900" name="appt-time-' + day + '-open-' + hours[k].id + '" value="' +
                hours[k].openHour + '" onclick="businessHours.updateRecorder(\'' + day +
                '\', \'' + hours[k].id + '\')">' +
                '</div>' +
                '<div class="day-hours" style="grid-column: 3;">' +
                '<input class="time-input" id="appt-time-' + day + '-close-hour-' + hours[k].id +
                '" type="time" step="900" name="appt-time-' + day + '-close-' + hours[k].id +
                '" value="' + hours[k].closeHour + '" onclick="businessHours.updateRecorder(\'' + day
                + '\', \'' + hours[k].id + '\')">' +
                '</div>' +
                '</div>' +
                '<div class="del-hours" id="' + day + '-hours-delete-' + hours[k].id + '">' +
                '<a class="" href="#!" onclick="businessHours.deleteRecorder(\'' + day + '\', \''
                + hours[k].id + '\')"><i class="fa fa-times"></i></a>' +
                '</div>';
        }
        el.innerHTML += '<div id="add-hours-' + day + '"class="add-hours">' +
            '<div><a class="" href="#!" onclick="businessHours.addRecorder(\'' 
            + day + '\')">' + '<i class="fa fa-plus"></i></a>' +
            '</div>';
    };

    /* Get open hours from the db for the selected day. Returns hours in minutes elapsed since day 0 format */
    this.getDayStatus = async function (day) {
        try {
            const response = await fetch(endpointsURLs.getDayStatus, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"day": day})
                /* set Open in table 'days' to true */
            })
            return await response.json();
        } catch(err) {
            console.log(err);
        }
    };

    /* Get open hours from the db for the selected day. Returns hours in minutes elapsed since day 0 format */
    this.getOpenHours = async function (day, readable = false) {
        try {
            const response = await fetch(endpointsURLs.getOpenHours, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"day": day, "readable": readable})
                /* set Open in table 'days' to true */
            })
            return await response.json();
        } catch(err) {
            console.log(err);
        }
    };

    /* Marks the day as closed in the DB then calls createHTMLOpen to update the markup */
    this.markDayAsClosed = async function (days) {
        try {
            const response = await fetch(endpointsURLs.markDayAsClosed, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"daysToClose": days})
            })
            return await response.json();
        } catch(err) {
            console.log(err);
        }
    };

    /* Marks the day as closed in the DB then calls createHTMLClosed to update the markup */
    this.markDayAsOpen = async function (days) {
        try {
            const response = await fetch(endpointsURLs.markDayAsOpen, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"daysToOpen": days})
            })
            return await response.json();
        } catch (err) {
            console.log(err);
        }
    };

    /* Disable holidays */
    this.markAsOpenForBus = async function () {
        try {
            const response = await fetch(endpointsURLs.markAsOpenForBus, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify("markAsOpenForBus")
            })
            return await response.json();
        } catch (err) {
            console.log(err);
        }
    };

    /* Enable holidays */
    this.markAsHolidays = async function () {
        try {
            const response = await fetch(endpointsURLs.markAsHolidays, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify("markAsHolidays")
            })
        } catch (err) {
            console.log(err);
        }
    };

    /* Wrapper calling either markAsHolidays or markAsOpenForBus according to the current state*/
    this.holidayMode = async function () {
        var hCheckbox = document.getElementById('holidaySwitch');
        if (hCheckbox.checked === true) {
            await this.markAsHolidays();
        }
        else if (hCheckbox.checked === false) {
            await this.markAsOpenForBus();
        }
        location.reload();
    };

    this.getHourPairId = async function(day) {
        try {
            const response = await fetch(endpointsURLs.getHourPairId, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"day": day})
            })
            return await response.json();
        } catch (err) {
            console.log(err);
        }
    };

    /* Self-explaining */
    this.addHours = async function(hoursToAdd){
        try {
            const response = await fetch(endpointsURLs.addHours, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"hoursToAdd": hoursToAdd})
            })
            return await response.json();
        } catch (err) {
            console.log(err);
        }
    };

    /* Self-explaining */
    this.updateHours = async function(hoursToUpdate) {
        try {
            const response = await fetch(endpointsURLs.updateHours, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"hoursToUpdate": hoursToUpdate})
            })
            return await response.json();
        } catch (err) {
            console.log(err);
        }
    };

    /* Self-explaining */
    this.deleteHours = async function(hoursToDelete) {
        try {
            const response = await fetch(endpointsURLs.deleteHours, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': CSRFToken
                },
                body: JSON.stringify({"hoursToDelete": hoursToDelete})
            });
            return await response.json();
        } catch (err) {
            console.log(err);
        }
    };


    /* Retreive hour pair from a div */
    this.getHourPairValues = function(div, id, day) {
        var el = document.getElementById(div);
        var openHour = el.childNodes[0].childNodes[0];
        var closeHour = el.childNodes[1].childNodes[0];

        return {"div": div, "id": id, "openHour": openHour.value, "closeHour": closeHour.value};
    };

    /* Wrapper function calling either getOpenHours or markDayAsClosed according to the checkbox state */
    this.markDayAs = async function (day) {
        var checkbox = document.getElementById(day + '-checkbox');
        /* Prevent from marking a day as open if holiday mode is active */
        if (document.getElementById('holidaySwitch').checked === true) {
            document.getElementById(day + '-checkbox').checked = false;
            return alert("Disable 'Holidays' to modify buisness hours.");
        }
        if (checkbox.checked === true) {
            OPEN = true;

            const readable = true;
            var opH = await this.getOpenHours(day, readable);

            this.createHTMLOpen(day, opH);
            daysToClose[day] = false;
            daysToOpen[day] = true;
        } 
        else if (checkbox.checked === false) {
            CLOSE = true;
            daysToOpen[day] = false;
            daysToClose[day] = true;
            this.createHTMLClosed(day);
        }
        /* Enable "Apply" button */
        if (document.getElementById('apply-btn').className !== 'hours-btn') {
            document.getElementById('apply-btn').className = 'hours-btn';
        }
    };

    this.deleteRecorder = function(day, hId) {
        /* Avoid trying to remove an hour more than once */
        if (taDivs.actions[2][day].some(item => item.taDiv === day + '-h-p-' + hId)) {
            console.log("Element is already planned to be deleted.");
        }
        /* Check for two conditions :
         * Check if hour pair was updated but already existing in the db, then deleted.
         * In that case remove it from the updated list and add it to the deleted list.
         * Check if hour pair was created but not added to the db then deleted.
         * In that case simply remove it from the add list */
        else if ((taDivs.actions[0][day].some(item => item.taDiv === day + '-h-p-' + hId)
            | (taDivs.actions[1][day].some(item => item.taDiv === day + '-h-p-' + hId)
                & !(taDivs.actions[0][day].some(item => item.taDiv === day + '-h-p-' + hId))))) {
            if ((taDivs.actions[1][day].some(item => item.taDiv === day + '-h-p-' + hId))
                & !(taDivs.actions[0][day].some(item => item.taDiv === day + '-h-p-' + hId))) {
                console.log("Updated then deleted.");

                var index = taDivs.actions[1][day].findIndex(item => item.taDiv === day + '-h-p-' + hId);
                taDivs.actions[1][day].splice([index], 1);
                taDivs.actions[2][day].push({"id": hId});
            }
            if (taDivs.actions[0][day].some(item => item.taDiv === day + '-h-p-' + hId)) {
                var index = taDivs.actions[0][day].findIndex(item => item.taDiv === day + '-h-p-' + hId);
                taDivs.actions[0][day].splice([index], 1);
                console.log("Created then deleted.");
            }
            this.createHTMLDelete(day, hId);
        }
        else {
            taDivs.actions[2][day].push({"id": hId});
            this.createHTMLDelete(day, hId);
        }
        if (document.getElementById('apply-btn').className !== 'hours-btn') {
            document.getElementById('apply-btn').className = 'hours-btn';
        }    

    };

    this.updateRecorder = function(day, hId) {
        if (taDivs.actions[1][day].some(item => item.taDiv === day + '-h-p-' + hId)) {
            console.log("Element is already planned to be updated.");
            /* If the hour was just created, do not put it in the updated list as well */
        } else if (taDivs.actions[0][day].some(item => item.taDiv === day + '-h-p-' + hId)) {
            console.log("Element is already planned to be added. ");
            /* check if hour updated was only clicked but not modified */
        } else {
            taDivs.actions[1][day].push({"id": hId, "taDiv": day + '-h-p-' + hId});
        }
        if (document.getElementById('apply-btn').className !== 'hours-btn') {
            document.getElementById('apply-btn').className = 'hours-btn';
        }
    }

    {
        /* The newly added div will start from the highest id in the DB + 1 */
        var dbHourPairIdOffset = 1;

        this.addRecorder = async function(day, hId) {
            /* Save the newly created div id into beforeFetch ->
             * get the freshly updated values from the divs of interest when updateDB
             * is called */
            var dbHourPairId  = await this.getHourPairId(day) + dbHourPairIdOffset++;
            if (taDivs.actions[0][day].some(item => item.taDiv === day + '-h-p-' + dbHourPairId)) {
                console.log("Element is already planned to be added.");
            } else {
                taDivs.actions[0][day].push({"taDiv": day + '-h-p-' + dbHourPairId});
                /* Generate the new div */
                this.createHTMLAdd(day, dbHourPairId);
            }
            if (document.getElementById('apply-btn').className !== 'hours-btn') {
                document.getElementById('apply-btn').className = 'hours-btn';
            }
        }

    }

    this.checkHPEq = function(o, c) {
        return (o == c);
    }

    this.simpleOverlap = function(o_a, o_b, c) {
        return (o_a >= o_b && o_a <= c );
    }

    this.nextDOverlap = function(cd, odp1) {
        return (cd >= odp1);
    }

    this.getNextDay = function(d) {
        if (d == "sunday") {
            return "monday"; 
        }
        else if (d == "monday") {
            return "tuesday";
        }
        else if (d == "tuesday") {
            return "wednesday";
        }
        else if (d == "wednesday") {
            return "thursday";
        }
        else if (d == "thursday") {
            return "friday";
        }
        else if (d == "friday") {
            return "saturday";
        }
        else if (d == "saturday") {
            return "sunday";
        }
        else {
            return null;
        }
    }

    this.getPrevDay = function(d) {
        if (d == "sunday") {
            return "saturday"; 
        }
        else if (d == "monday") {
            return "sunday";
        }
        else if (d == "tuesday") {
            return "monday";
        }
        else if (d == "wednesday") {
            return "tuesday";
        }
        else if (d == "thursday") {
            return "wednesday";
        }
        else if (d == "friday") {
            return "thursday";
        }
        else if (d == "saturday") {
            return "friday";
        }
        else {
            return null;
        }
    }

    /* OK */
    /* We check if hour pairs of a day don't overlap each other */
    this.checkSameDay = function(hours) {

        var err = false;

        for (d in hours) {
            for (var i = 0; i < hours[d].length; ++i) {
                var op_i = hours[d][i].openHour;
                var cl_i = hours[d][i].closeHour;

                /* To check if saturday hours are not overlapping each other we have to consider closing hour not
                 * being reset to 0 */
                if ((d == "saturday") && (cl_i < 1439)) {
                    cl_i += 10080;
                }
                /* Check if open and close are equal */
                if (this.checkHPEq(op_i, cl_i)) {
                    err = true;
                    this.markDivAsFaulty(hours[d][i].div);
                    console.log("Opening hour and closing hour must be different.");
                }

                for (var j = i + 1; j < hours[d].length; ++j) {
                    var op_j = hours[d][j].openHour;
                    var cl_j = hours[d][j].closeHour;

                    /* To check if saturday hours are not overlapping each other we have to consider closing hour not
                     * being reset to 0 */
                    if ((d == "saturday") && (cl_j < 1439)) {
                        cl_j += 10080;
                    }

                    /* Check if open and close are equal */
                    if (this.checkHPEq(op_j, cl_j)) {
                        err = true;
                        this.markDivAsFaulty(hours[d][i].div);
                        this.markDivAsFaulty(hours[d][j].div);
                        console.log("Open hour and closing hour must be different.");
                    }

                    /* Check 'a' pair on 'b' pair */
                    if (this.simpleOverlap(op_i, op_j, cl_j)) {
                        err = true;
                        this.markDivAsFaulty(hours[d][i].div);
                        this.markDivAsFaulty(hours[d][j].div);
                        console.log("Overlapping hours on", d, ": ", hours[d][i], " overlaps ", hours[d][j]);
                    }

                    /* Check 'b' pair on 'a' pair */
                    if (this.simpleOverlap(op_j, op_i, cl_i)) {
                        err = true;
                        this.markDivAsFaulty(hours[d][i].div);
                        this.markDivAsFaulty(hours[d][j].div);
                        console.log("Overlapping hours on", d, ": ", hours[d][j], " overlaps ", hours[d][i]);
                    }
                }
            }
        }
        return err;
    }

    this.checkNextDay = function(hours) {

        var err = false;

        for (d in hours) {
            var nextDay = this.getNextDay(d);
            /* D hours */
            for (var i = 0; i < hours[d].length; ++i) {
                var op_i = hours[d][i].openHour;
                var cl_i = hours[d][i].closeHour;
                /* D + 1 hours */
                for (var x = 0; x < hours[nextDay].length; ++x) {
                    var op_x = hours[nextDay][x].openHour;
                    if ((d == "saturday") && (cl_i <= op_i) && (cl_i >= op_x)) {
                        err = true;
                        this.markDivAsFaulty(hours[d][i].div);
                        this.markDivAsFaulty(hours[nextDay][x].div);
                        console.log("Closing hour ",hours[d][i], " overlaps next day opening hour ", hours[nextDay][x]);
                    }
                    /* Check if d closing hour is overlapping d + 1 opening hour */
                    else if ((cl_i >= op_x) && (nextDay != "sunday")) {
                        err = true;
                        this.markDivAsFaulty(hours[d][i].div);
                        this.markDivAsFaulty(hours[nextDay][x].div);
                        console.log("Closing hour ", hours[d][i], " overlaps next day opening hour ", hours[nextDay][x]);
                    }
                }
            }
        }

        return err;
    }

    this.updateDays = async function() {
        if (OPEN === true)
            await this.markDayAsOpen(daysToOpen);
        if (CLOSE === true)
            await this.markDayAsClosed(daysToClose);
    }


    this.hoursToDelete = async function() {
        var hours = {"monday": [], "tuesday": [], "wednesday": [], "thursday": [], "friday": [], 
            "saturday": [], "sunday": []
        };
        var del = false;
        /* Not necessary for now */
        var del_err = false;
        for (const [d, v] of Object.entries(taDivs.actions[2])) {
            for (var tD = 0; tD < v.length; tD++) {
                del = true;
                hours[d].push({"id": v[tD].id});
            }
        }
        if (del && !del_err) {
            await this.deleteHours(hours);
            console.log("Hours successfully deleted.");
        }
        return del_err;
    }

    this.hoursToUpdate = async function() {

        var upd = 0;
        var err = false;
        var err_n = false;
        var hours = {"sunday": [], "monday": [],"tuesday": [], "wednesday": [], "thursday": [], "friday": [],
            "saturday": []
        };

        for (const [d, v] of Object.entries(taDivs.actions[1])) {
            /* TODO - pass an array of days instead of calling the same function multiple times */
            const st = await this.getDayStatus(d);
            /* Ignore overlapping hours with currently closed or set to be closed days */
            if (st["status"] == 0 && daysToOpen[d] == false) {
                continue;
            }
            if (st["status"] == 1 && daysToClose[d] == true) {
                continue;
            }
            /* Start by appending existing hours to the oject */
            const json = await this.getOpenHours(d);
            if (json !== null) {
                hours[d] = json;
            }
            for (var tD = 0; tD < v.length; tD++) {
                upd = 1;
                for (var i = 0; i < hours[d].length; i++) {
                    var tmp = this.convertToMinElapsed(this.getHourPairValues(v[tD].taDiv, v[tD].id, d), d);
                    if (hours[d][i].div == tmp.div) { 
                        hours[d][i] = tmp;
                    }
                }

            }
        }

        if (upd == 1) {

            /* Check if updated hours are not conflicting with existing hours */
            err = this.checkSameDay(hours);
            /* Check if for a D hour pair, a D + 1 hour pair is not conflicting with it */
            err_n =  this.checkNextDay(hours);
            /* Set error if any day contains a problematic hour pair */
            if (err || err_n) {
                console.log("Error in hours to update.");
            } 
            else {
                await this.updateHours(hours);
                console.log("Hours successfully updated.");
            }

        }

        return (err || err_n);
    }

    this.hoursToAdd = async function() {

        var hours = {"sunday": [], "monday": [],"tuesday": [], "wednesday": [], "thursday": [], "friday": [],
            "saturday": []
        };

        var newHours = {"sunday": [], "monday": [],"tuesday": [], "wednesday": [], "thursday": [], "friday": [],
            "saturday": []
        };

        for (const [d, v] of Object.entries(taDivs.actions[0])) {
            /* TODO - pass an array of days instead of calling the same function multiple times */
            const st = await this.getDayStatus(d);
            /* Ignore overlapping hours with currently closed or set to be closed days */
            if (st["status"] == 0 && daysToOpen[d] == false) {
                continue;
            }
            if (st["status"] == 1 && daysToClose[d] == true) {
                continue;
            }
            /* Start by appending existing hours to the oject */
            const json = await this.getOpenHours(d);
            if (json !== null) {
                hours[d] = json;
            }
            for (var tD = 0; tD < v.length; tD++) {
                /* Retreive actual hour pairs from the markup and add them to the list already populated 
                 * by existing hours */
                hours[d].push(this.convertToMinElapsed(this.getHourPairValues(v[tD].taDiv, v[tD].id, d), d));
                newHours[d].push(this.convertToMinElapsed(this.getHourPairValues(v[tD].taDiv, v[tD].id, d), d));
            }

        }

        /* Check if new hours are not conflicting with existing hours */
        const err = this.checkSameDay(hours);
        /* Check if for a D hour pair, a D + 1 hour pair is not conflicting with it */
        const err_n =  this.checkNextDay(hours);

        if (err || err_n) {
            console.log("Error in hours to add. Check errors");
        }
        else {
            await this.addHours(newHours);
        }
        return (err || err_n);
    }

    /* Update the DB - called when the user clicks on 'apply' */
    this.updateDB = async function() {

        const del = await this.hoursToDelete();
        const upd = await this.hoursToUpdate();
        const add = await this.hoursToAdd();

        /* If no error */
        if (!add && !upd && !del) {
            await this.updateDays();
            location.reload();
        }

    };

}).apply(businessHours);


