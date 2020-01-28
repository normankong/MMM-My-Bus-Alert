/* Magic Mirror
 * Module: My Bus ETA Helper
 */
const NodeHelper = require("node_helper");
var Fetcher_MyBus = require("./Fetcher_MyBus.js");

module.exports = NodeHelper.create({

    start: function () {

        // Fetchers for all ETAs
        this.etaFetchers = {};
    },

    /**
     * Log in Console
     */
    socketNotificationReceived: function (notification, payload) {

        self = this;
        // Request for information
        if (notification === "ADD_STOPS") {
            for (var i in payload) {
                let tmpSection = payload[i];

                for (var j in tmpSection) {
                    let tmpSection2 = tmpSection[j];
                    for (var k in tmpSection2.busRoutes) {
                        let requestObject = {
                            time: tmpSection2.time,
                            bsiCode: tmpSection2.bsiCode,
                            busBound: tmpSection2.busBound,
                            busRoute: tmpSection2.busRoutes[k],
                            reloadInterval: tmpSection2.reloadInterval,
                            key: tmpSection2.bsiCode + tmpSection2.busBound + tmpSection2.busRoutes[k]
                        }
                        self.createETAFetcher(requestObject);
                    }

                }
            }
            return;
        }
    },

    /* Creates a fetcher for collecting ETA info
     *
     * @param {routeObject} the Route Request Object (an object)
     */
    createETAFetcher: function (routeObject) {
        var self = this;
        var fetcher = new Fetcher_MyBus(routeObject);

        if (typeof self.etaFetchers[routeObject.key] === "undefined") {
            console.log(`Create new ETA fetcher for route:`, routeObject);
            fetcher.onReceive(function (fetcher) {
                self.broadcastETAs();
            });
            fetcher.onError(function (fetcher, error) {
                self.sendSocketNotification("FETCH_ERROR", {
                    error: error
                });
            });
            self.etaFetchers[routeObject.key] = fetcher;
            fetcher.startFetch();
        } else {
            console.log(`Use existing ETA fetcher for route: ${routeObject.bsiCode}`);
            fetcher = self.etaFetchers[routeObject.key];
            fetcher.broadcastItems();
        }
    },
    /* broadcastETAs()
     * Creates an object with all feed items of the different registered ETAs,
     * and broadcasts these using sendSocketNotification.
     */
    broadcastETAs: function () {
        var etas = [];
        for (var f in this.etaFetchers) {
            if (this.etaFetchers[f].items() == null)
                continue;
            etas.push(this.etaFetchers[f].items());
        }

        this.sendSocketNotification("ETA_ITEMS", {
            etaItems: etas,
            basicInfo: this.basicInfo
        });
    },
});