var utils;
(function (utils) {
    "use strict";

    utils.getMinMax = function (rows, pos) {

        var arr = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row[pos] > 0)
                arr.push(row[pos]);
        }

        var min = Math.min.apply(null, arr);
        var max = Math.max.apply(null, arr);

        return { min: min, max: max };
    }

    utils.fromOaDate = function (nSerialDate) {

        if (nSerialDate == undefined || nSerialDate === "" || isNaN(nSerialDate))
            return undefined;

        var date = new Date();

        date.setTime((nSerialDate - 25569) * 24 * 3600 * 1000);

        var localTimeZoneDate = date.getTime() + (date.getTimezoneOffset() * 60000);
        var t = new Date(localTimeZoneDate);

        return t;

    }

    utils.substract = function (dateMax, dateMin, format) {
        var d = dateMax.getTime() - dateMin.getTime();

        if (format === "s") {
            return d / 1000;
        }

        if (format === "m") {
            return d / 1000 / 60;
        }

        if (format === "h") {
            return d / 1000 / 60 / 60;
        }

        return d;
    }

    utils.arrayFromObject = function (obj) {
        var arr = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                arr.push(obj[i]);
            }
        }
        return arr;
    }

    utils.groupBy = function (list, fn) {
        var groups = {};

        for (var i = 0; i < list.length; i++) {

            var group = JSON.stringify(fn(list[i]));

            if (group in groups) {
                groups[group].push(list[i]);
            } else {
                groups[group] = [list[i]];
            }
        }
        return utils.arrayFromObject(groups);
    }

    utils.tryParseIsoDateString = function (text) {
        // Matches an ISO date and separates out the fractional part of the seconds
        // because IE < 10 has quirks parsing fractional seconds
        var isoDateRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d*))?Z$/;

        // Check against a lenient regex
        var matchedDate = isoDateRegex.exec(text);
        if (matchedDate) {
            // IE9 only handles precisely 0 or 3 decimal places when parsing ISO dates,
            // and IE8 doesn't parse them at all. Fortunately, all browsers can handle
            // 'yyyy/mm/dd hh:MM:ss UTC' (without fractional seconds), so we can rewrite
            // the date to that format, and the apply fractional seconds.
            var dateWithoutFraction = matchedDate[1], fraction = matchedDate[2] || "0", milliseconds = Math.round(1000 * Number("0." + fraction));
            dateWithoutFraction = dateWithoutFraction.replace(/\-/g, "/").replace("T", " "); // yyyy/mm/ddThh:mm:ss -> yyyy/mm/dd hh:mm:ss

            // Try and parse - it will return NaN if invalid
            var ticks = Date.parse(dateWithoutFraction + " UTC");
            if (!isNaN(ticks)) {
                return new Date(ticks + milliseconds);
            }
        }

        // Doesn't look like a date
        return null;
    }

    utils.add = function (startDate, timeSpan, format) {

        if (format === "s") {
            timeSpan *= 1000;
        }
        if (format === "m") {
            timeSpan *= 1000 * 60;
        }
        if (format === "h") {
            timeSpan *= 1000 * 60 * 60;
        }

        var finalDate = new Date();
        finalDate.setTime(startDate.getTime() + timeSpan);
        return finalDate;
    }


})(utils || (utils= {}));
