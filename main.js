"use strict";

/*
 * Created with @iobroker/create-adapter v2.5.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
const axios = require("axios").default;
const cheerio = require("cheerio");

class HellofreshReceipeVote extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "hellofresh-receipe-vote",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Get the current week and year to construct the right URL
	 */
	weekAndYear(weeksInFuture) {
		// StartDate
		const startDate = new Date("12/30/2022");
		startDate.setHours(0, 0, 0, 0);

		// Current Date
		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);

		// Calculate passed days
		// @ts-ignore
		const passedDays = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));

		// Calculate week number
		const tempWeekNum = Math.ceil(passedDays / 7) + weeksInFuture;
		const weekNum = tempWeekNum % 52 === 0 ? 52 : tempWeekNum % 52;

		// Calculate year
		const year = 2022 + Math.ceil(tempWeekNum / 52);

		return {
			week: weekNum,
			year: year,
		};
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		const url = this.config.URL;
		const divClass = this.config.Klasse;
		const weeks = this.config.NumWeeks;

		if (!url || !divClass) {
			this.log.error("URL oder Klassse nicht konfiguriert");
			return;
		}

		for (let i = 0; i < weeks + 1; i++) {
			const dateObj = this.weekAndYear(i);
			const { year, week } = dateObj;
			const weekStr = week.toString().padStart(2, "0");

			const urlToFetch = `${url}${year}-W${weekStr}`;

			this.log.info(`URL to fetch: ${urlToFetch}`);

			try {
				// Abrufen des HTML-Inhalts der Webseite
				const response = await axios.get(urlToFetch);
				const html = response.data;

				// Laden des HTML-Inhalts mit Cheerio
				const $ = cheerio.load(html);

				const results = [];
				$("div.web-26xi0f").each((index, element) => {
					const h2Text = $(element).find("h2").text();
					const h4Text = $(element).find("h4").text();

					const srcSet = $(element).find("img").attr("srcset");
					// @ts-ignore
					const firstSrc = srcSet.split(" ")[0].trim().split(" ")[0];

					const subHeading = $(element).find(".web-81sg6d").text() || $(element).find(".web-far4uw").text();

					const duration = $(element).find(".web-1u07yy9").text();

					const info = $(element).find(".web-1j8oxav").text();

					results.push({
						src: firstSrc,
						title: h2Text || h4Text,
						subTitle: subHeading,
						duration: duration,
						info: info,
					});
				});

				const numMeals = results.length;
				this.log.info(`We have ${numMeals} meals this week`);

				// Verwenden Sie die getObject-Funktion, um Informationen über das Objekt abzurufen
				this.getObject(`hellofresh-receipe-vote.0.${year}_${weekStr}`, (err, obj) => {
					if (!err && obj) {
						// Das Gerät existiert
						console.log(`Das Gerät '${year}_${weekStr}' existiert bereits.`);
					} else {
						// Das Gerät existiert nicht
						console.log(`Das Gerät '${year}_${weekStr}' existiert nicht.`);
						this.createDevice(`${year}_${weekStr}`);

						for (let i = 0; i < numMeals; i++) {
							const mealStr = `meal_${i}`;
							this.createChannel(`${year}_${weekStr}`, mealStr);
							// Create State "Title"
							this.createState(
								`${year}_${weekStr}`,
								mealStr,
								"title",
								{ name: "Titel of Meal", type: "string", role: "value" },
								function () {},
							);
							this.setState(`${year}_${weekStr}.${mealStr}.title`, { val: results[i].title, ack: true });
							// Create State "SubTitle"
							this.createState(
								`${year}_${weekStr}`,
								mealStr,
								"subTitle",
								{ name: "Subtitel of Meal", type: "string", role: "value" },
								function () {},
							);
							this.setState(`${year}_${weekStr}.${mealStr}.subTitle`, {
								val: results[i].subTitle,
								ack: true,
							});
							// Create State "imageSrc"
							this.createState(
								`${year}_${weekStr}`,
								mealStr,
								"imageSrc",
								{ name: "ImageSrc of Meal", type: "string", role: "value" },
								function () {},
							);
							this.setState(`${year}_${weekStr}.${mealStr}.imageSrc`, {
								val: results[i].src,
								ack: true,
							});
							// Create State "duration"
							this.createState(
								`${year}_${weekStr}`,
								mealStr,
								"duration",
								{ name: "Duration of Meal Preparation", type: "string", role: "value" },
								function () {},
							);
							this.setState(`${year}_${weekStr}.${mealStr}.duration`, {
								val: results[i].duration,
								ack: true,
							});
							// Create State "info"
							this.createState(
								`${year}_${weekStr}`,
								mealStr,
								"info",
								{ name: "Info of Meal", type: "string", role: "value" },
								function () {},
							);
							this.setState(`${year}_${weekStr}.${mealStr}.info`, {
								val: results[i].info,
								ack: true,
							});
							// Create State "votes"
							this.createState(
								`${year}_${weekStr}`,
								mealStr,
								"votes",
								{ name: "Votes for Meal", type: "number", role: "value" },
								function () {},
							);
							this.setState(`${year}_${weekStr}.${mealStr}.votes`, {
								val: 0,
								ack: true,
							});
							// Create State "choosen"
							this.createState(
								`${year}_${weekStr}`,
								mealStr,
								"choosen",
								{ name: "Meal is choosen", type: "boolean", role: "value" },
								function () {},
							);
							this.setState(`${year}_${weekStr}.${mealStr}.choosen`, {
								val: false,
								ack: true,
							});
						}
					}
				});
			} catch (error) {
				this.log.error("Error while calling HelloFresh");
				this.log.error(error);
			}
		}

		// try {
		// 	// Pfad zu den gewünschten States
		// 	const statePath = "hellofresh-receipe-vote.0.week_0.menu_0.title";

		// 	// Die getStatesAsync-Funktion aufrufen, um die States abzurufen
		// 	const states = await this.getStatesAsync(statePath);

		// 	// Überprüfen, ob States gefunden wurden
		// 	if (states && Object.keys(states).length > 0) {
		// 		// States wurden gefunden
		// 		this.log.info("Gefundene States:");
		// 		// this.log.info(states);
		// 	} else {
		// 		// Keine States gefunden
		// 		this.log.info("Keine States unter dem Pfad gefunden: " + statePath);
		// 	}
		// } catch (error) {
		// 	// Bei einem Fehler eine Fehlermeldung ausgeben
		// 	this.log.error(`Fehler beim Lesen der States:, ${error}`);
		// }

		this.log.debug(`Current URL is ${url} and Class is ${divClass}`);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	// onObjectChange(id, obj) {
	// 	if (obj) {
	// 		// The object was changed
	// 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
	// 	} else {
	// 		// The object was deleted
	// 		this.log.info(`object ${id} deleted`);
	// 	}
	// }

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new HellofreshReceipeVote(options);
} else {
	// otherwise start the instance directly
	new HellofreshReceipeVote();
}
