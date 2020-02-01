// const moment = require("moment");

/* Magic Mirror
 * Module: MMM-My-Bus-Alert
 *
 * By Norman Kong
 * MIT Licensed.
 * 
 * v1.0.0
 */

Module.register("MMM-My-Bus-Alert", {

    defaults: {
        stops: [{
            time: ["07:45", "08:10"],
            bsiCode: 'CA07-S-2900-0',
            busRoutes: ["67X"],
            busBound: "1",
        }]
    },

    getTranslations: function () {
        return {
            "en": "translations/en.json",
            "zh-tw": "translations/zh.json"
        };
    },

    getStyles: function () {
        return ["MMM-My-Bus-Alert.css"];
    },

    start: function () {
        var self = this;
        Log.info("Starting module: " + this.name);

        // Collect the stop info (including the routes that the stop)
        this.etaItems = [];

        this.sendSocketNotification("ADD_STOPS", {
            config: this.config.stops
        });
    },

    notificationReceived: function (notification, payload, sender) {
        if (notification === "CLOCK_MINUTE") {
            this.updateDom();
        }
    },

    socketNotificationReceived: function (notification, payload) {
        console.log(`Receive `, payload);
        if (notification === "ETA_ITEMS") {

            // The feed itself contains all the ETAs
            this.etaItems = payload.etaItems.sort(function (a, b) {
                if (a.data.route.Route > b.data.route.Route)
                    return -1;
                if (a.data.route.Route < b.data.route.Route)
                    return 1;
                return 1;
            });
            this.updateDom();
        }
    },

    /* subscribedToFeed(feedUrl)
     * Check if this module is configured to show this feed.
     *
     * attribute feedUrl string - Url of the feed to check.
     *
     * returns bool
     */
    subscribedToFeed: function (feedUrl) {
        for (var f in this.config.ETAs) {
            var feed = this.config.ETAs[f];
            if (feed.url === feedUrl) {
                return true;
            }
        }
        return false;
    },

    /* subscribedToFeed(feedUrl)
     * Returns title for a specific feed Url.
     *
     * attribute feedUrl string - Url of the feed to check.
     *
     * returns string
     */
    titleForFeed: function (feedUrl) {
        for (var f in this.config.ETAs) {
            var feed = this.config.ETAs[f];
            if (feed.url === feedUrl) {
                return feed.title || "";
            }
        }
        return "";
    },

    getDom: function () {

        var wrapper = document.createElement("div");

        // Actually it is a new redraw
        if (this.etaItems === null) {
            wrapper.innerHTML = this.translate("LOADING");
            wrapper.className = "small dimmed";
            return wrapper;
        }

        var row = 0;
        for (t in this.etaItems) {
            var etaObj = this.etaItems[t];
            if (etaObj.type == "DUMMY") continue;
            row++

            // Format the Result Object
            let result = this.getResult(etaObj);
            wrapper.appendChild(result);
        }

        if (row == 0) {
            wrapper.innerHTML = ""
            wrapper.className = "small dimmed";
            return wrapper;
        }

        return wrapper;
    },

    getResult: function (routeObj) {
        if (!routeObj || routeObj.length == 0)
            return null;

        let priResult = "";
        let subResult = "";

        let etaInfo = routeObj.data.raw.data.response;
        if (etaInfo == null || etaInfo.length == 0) {
            priResult += this.translate("LAST_BUS_DEPART")

        } else {
            let now = moment();
            let i = 0;
            for (r in etaInfo) {
                var etaStr = etaInfo[r].t.split('　')[0];
                let etaTime = moment(etaStr, "hh:mm:ss");
                if (etaTime > now) {
                    let text = moment.duration(now.diff(etaTime)).humanize().replace(" ", "");
                    let desc = `${this.translate("STILL_HAVE")}${text}`;
                    if (priResult == "") {
                        priResult = `${routeObj.data.route.Route} ${desc}`;
                    }
                    subResult += `${++i}. ${etaStr} ${desc}<br/>`;
                }
            }
        }

        var priDiv = document.createElement("div");
        priDiv.className = "dataRow";
        priDiv.innerHTML = priResult;

        var subDiv = document.createElement("div");
        subDiv.className = "subRow";
        subDiv.innerHTML = subResult

        var resultDiv = document.createElement("div");
        resultDiv.append(priDiv);
        resultDiv.append(subDiv);

        return resultDiv;
    }

});