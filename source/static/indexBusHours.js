/* Compares current date and time obtained from the server to business hours.
 * Returns "open" or "closed" accordingly */
var indexBusHours = {};
(function() {

    var today;
    var businessHours;

    /* Get today's date from the server */
    this.setToday = function(serverDateTime) {
        today = JSON.parse(serverDateTime);
        return 0;
    }

    /* Get business hours from the DB */
    this.setBusHours = function(busHours) {
        businessHours = JSON.parse(busHours);
        return 0;
    }

    /* Returns a day index */
    this.getDayIndex = function(day) {
        if (day == "monday")
            return 0;
        else if (day == "tuesday")
            return 1;
        else if (day == "wednesday")
            return 2;
        else if (day == "thursday")
            return 3;
        else if (day == "friday")
            return 4;
        else if (day == "saturday")
            return 5;
        else if (day == "sunday")
            return 6;
        else {
            console.log("Invalid day value.");
            return null;
        }
    };

    /* Remove the colon between hours and minutes and returns time as an int */
    this.removeColon = function(hour) {
        var index = 2;
        return hour.substring(0, index) + hour.substring(index + 1, hour.length);
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



    /* Check if current time is between business hours */
    this.getBusinessStatus = function() {
        var open = false;
        var closed = false;
        today.day = today.day.toLowerCase();

        /* Now check if we are within business hours for today */
        /* For each pair of hour ; [i][1] == open hour - [i][2] == close hour */
        var idx = this.getDayIndex(today.day);
        var idxNext = this.getDayIndex(this.getNextDay(today.day));
        var idxPrev = this.getDayIndex(this.getPrevDay(today.day));
        var now = today.time;

        for (var i = 0; i < businessHours[idx]["hours"].length; ++i) {

            var op = businessHours[idx]["hours"][i].openHour;
            var cl = businessHours[idx]["hours"][i].closeHour;

            if ((businessHours[idx]["day"] == "saturday") && (cl < 1439)) {
                cl += 10080;
            }

            if (now >= op && now <= cl && businessHours[idx]["status"] != 0) {
                open = true;
                break;
            }
        }

        if (!open) {
            for (var i = 0; i < businessHours[idxNext]["hours"].length; ++i) {
                var op = businessHours[idxNext]["hours"][i].openHour;
                var cl = businessHours[idxNext]["hours"][i].closeHour;

                if ((businessHours[idxNext]["day"] == "saturday") && (cl < 1439)) {
                    cl += 10080;
                }

                if (now >= op && now <= cl && businessHours[idxNext]["status"] != 0) {
                    open = true;
                    break;
                }
            }
        }

        if (!open) {
            for (var i = 0; i < businessHours[idxPrev]["hours"].length; ++i) {
                var op = businessHours[idxPrev]["hours"][i].openHour;
                var cl = businessHours[idxPrev]["hours"][i].closeHour;

                if ((businessHours[idxPrev]["day"] == "saturday") && (cl < 1439)) {
                    cl += 10080;
                }
                if (now >= op && now <= cl && businessHours[idxPrev]["status"] != 0) {
                    open = true;
                    break;
                }
            }
        }
        if (open) {
            this.createHTMLOpen();
        }
        else {
            this.createHTMLClosed();
        }
    };

    /* Set the day to 'open' in the HTML page */
    this.createHTMLOpen = function() {
        var div = document.getElementById("business-st-container");
        div.innerHTML = '<div class="business-status">We are currently OPEN</div>';
        var svg = document.getElementById("svg");
        svg.style.transform = "translate(-9px, 21px)";
    };
    /* Set the day to 'closed' in the HTML page */
    this.createHTMLClosed = function(st) {
        var div = document.getElementById("business-st-container");
        div.innerHTML = '<div class="business-status">We are currently CLOSED</div>';
        var svg = document.getElementById("svg");
        svg.style.transform = "translate(1px, 21px)";
    };

}).apply(indexBusHours);

