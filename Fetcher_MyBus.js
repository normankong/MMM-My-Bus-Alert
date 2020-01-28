/* 
 * Fetcher_MyBus.js
 */
require('dotenv').config();
var request = require("request");
var moment = require("moment");
var etaUrl = process.env.ETA_URL;

/* Fetcher_ETA
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * attribute reloadInterval number - Reload interval in milliseconds.
 */

var Fetcher_MyBus = function (routeObject) {
	var self = this;
	var reloadInterval = routeObject.reloadInterval;
	if (reloadInterval < 60000) {
		reloadInterval = 60000;
	}

	self.routeObject = routeObject;

	var reloadTimer = null;
	var items = [];

	var fetchFailedCallback = function () {};
	var itemsReceivedCallback = function () {};

	/* fetchETA()
	 * Request the ETA.
	 */
	var fetchETA = function () {
		// Clear timer
		clearTimeout(reloadTimer);
		reloadTimer = null;

		// Only trigger during effective time range
		var format = 'hh:mm:ss';
		var now = moment(),
			beforeTime = moment(self.routeObject.time[0], format),
			afterTime = moment(self.routeObject.time[1], format);

		// Not in effective time
		if (!now.isBetween(beforeTime, afterTime)) {
			console.log(`${moment()} Skip bus : ${self.routeObject.busRoute }`);

			// Remove the previous display
			if (items[0] != null) {
				items[0].type = "DUMMY";
				self.broadcastItems();
			}
			scheduleTimer();
			return;
		}

		// Clear the Result
		items = [];

		// console.log(`Triggering ETA : `, self.routeObject.bsiCode , self.routeObject.busBound , etaUrl)
		request.post({
			url: etaUrl,
			body: genBody(routeObject),
			headers: getHeaders()
		}, (error, response, body) => {

			if (response.statusCode === 200) {
				responseObj = JSON.parse(body);
				if (!responseObj || !responseObj.code != '000') {
					console.log("Error obtaining ETA connections " + response.statusCode);
					fetchFailedCallback(self, error);
					scheduleTimer();
				}
				console.log(`${self.routeObject.busRoute} refresh success`);
				items.push(responseObj);
				self.broadcastItems();
				scheduleTimer();
			} else {
				console.log("Error getting ETA connections " + response.statusCode);
				fetchFailedCallback(self, error);
				scheduleTimer();
			}
		});

	};

	/* scheduleTimer()
	 * Schedule the timer for the next update.
	 */

	var scheduleTimer = function () {
		// console.log('Schedule update timer.');
		self.setRandomReloadInterval(reloadInterval);
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function () {
			fetchETA();
		}, reloadInterval);
	};

	var genBody = function (routeObject) {
		var json = {
			"identify": process.env.ETA_IDENTIFY,
			"busRoute": routeObject.busRoute,
			"bsiCode": routeObject.bsiCode,
			"busBound": routeObject.busBound
		}
		// console.log(json)
		return JSON.stringify(json);
	};

	var getHeaders = function () {
		let headers = {
			"Content-Type": "application/json",
			"authorization": process.env.ETA_JWT,
			"x-api-key": process.env.ETA_API_KEY,
		}
		return headers;
	};

	/* public methods */

	/* setReloadInterval()
	 * Update the reload interval
	 *
	 * attribute interval number - Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function (interval) {
		reloadInterval = interval;
	};

	this.setRandomReloadInterval = function (interval) {
		var min = Math.ceil(interval + 1000);
		var max = Math.floor(interval + 5000);
		var newInterval = Math.floor(Math.random() * (max - min + 1)) + min;
		this.setReloadInterval(newInterval)
	}

	/* startFetch()
	 * Initiate fetchETA();
	 */
	this.startFetch = function () {
		fetchETA();
	};

	/* broadcastItems()
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function () {
		if (items.length <= 0) {
			console.log('No items to broadcast yet.');
			return;
		}
		//console.log('Broadcasting ' + items.length + ' items.');
		itemsReceivedCallback(self);
	};

	this.onReceive = function (callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function (callback) {
		fetchFailedCallback = callback;
	};

	this.url = function () {
		return url;
	};

	this.route = function () {
		return stopInfo.Route;
	}

	this.items = function () {
		return items[0];
	}
};

module.exports = Fetcher_MyBus;