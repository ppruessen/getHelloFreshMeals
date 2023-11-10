class Calculator {
	static weekAndYear(weeksInFurture) {
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
		const tempWeekNum = Math.ceil(passedDays / 7) + weeksInFurture;
		const weekNum = tempWeekNum % 52 === 0 ? 52 : tempWeekNum % 52;

		// Calculate year
		const year = 2022 + Math.ceil(tempWeekNum / 52);

		console.log(`Passed days: ${passedDays}, Temp Week: ${tempWeekNum} Week Number: ${weekNum}, Year = ${year}`);
		return {
			week: weekNum,
			year: year,
		};
	}
}

/**
 * 31.12.22 => W01 2023
 * 23.12.23 => W52 2023
 * 29.12.23 => W52 2023
 * 30.12.23 => W01 2024
 */

// calculateDate("12/29/2023"); // W52 - 2023
// calculateDate("12/30/2023"); // W01 - 2024
// calculateDate("11/10/2023"); // W45 - 2023
// calculateDate("11/11/2023"); // W46 - 2023
Calculator.weekAndYear(0);
Calculator.weekAndYear(1);
Calculator.weekAndYear(2);
Calculator.weekAndYear(3);
Calculator.weekAndYear(4);
Calculator.weekAndYear(5);
Calculator.weekAndYear(6);
Calculator.weekAndYear(7);
Calculator.weekAndYear(8);

module.exports = Calculator;
