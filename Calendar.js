const moment = require('moment')
const fs = require('fs')

function calendarJSON(calendarNumber) {
	 let rawdata = fs.readFileSync('./calendars/calendar.' + calendarNumber + '.json')
	 return JSON.parse(rawdata)
}

function getAvailableSpots(calendar, date, duration) {
    
    let data = calendarJSON(calendar)

    console.log('data', data)

    const dateISO = moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD')
    let durationBefore = data.durationBefore;
    let durationAfter = data.durationAfter;
    let daySlots = []
    if (data.slots.hasOwnProperty(date)) {
        daySlots = data.slots[date]
    }
    console.log('day slots', daySlots)

    console.log('data sessions', data.sessions)
    console.log(`data sessions w/date ${date}`, data.sessions[date])



    console.log('----- new algo')
    let availableSlots = []

    function getAvailableSlots(data, date) {

        const slots = data.slots[date] || []
        const sessions = data.sessions[date] || []

        //filter slots that conflict with sessions (aka are booked) 
        return slots.filter(({ start: slotStart, end: slotEnd }) => {
            //get moment objects
            const slotStartTime = moment(`${date} ${slotStart}`, 'DD-MM-YYYY HH:mm')
            const slotEndTime = moment(`${date} ${slotEnd}`, 'DD-MM-YYYY HH:mm')

            //check for overlap
            return !sessions.some(({ start: sessionStart, end: sessionEnd }) => {
                //convert times into moment objects
                const sessionStartTime = moment(`${date} ${sessionStart}`, 'DD-MM-YYYY HH:mm')
                const sessionEndTime = moment(`${date} ${sessionEnd}`, 'DD-MM-YYYY HH:mm')

                //main logic to check for overlap
                //https://momentjscom.readthedocs.io/en/latest/moment/05-query/06-is-between/
                return (
                    slotStartTime.isBetween(sessionStartTime, sessionEndTime, null, '[)') ||
                    slotEndTime.isBetween(sessionStartTime, sessionEndTime, null, '(]') ||
                    sessionStartTime.isBetween(slotStartTime, slotEndTime, null, '[)') ||
                    sessionEndTime.isBetween(slotStartTime, slotEndTime, null, '(]')
                );
            });
        });
    }

    availableSlots = getAvailableSlots(data, date)
    console.log('formatted:', availableSlots)

    /**
    * Returns an array of available time slots for a given date and duration.
    * @param {Array} realSpots - An array of available time slots.
    * @param {string} dateISO - The date in ISO format (YYYY-MM-DD).
    * @param {number} durationBefore - The duration before the appointment.
    * @param {number} duration - The duration of the appointment.
    * @param {number} durationAfter - The duration after the appointment.
    * @returns {Array} An array of available time slots.
    */
    function getSlots(realSpots, dateISO, durationBefore, duration, durationAfter) {
        //will return this after storing the data
        const arrSlot = []

        //check all the time slots and see if given the duration you will have enough time
        realSpots.forEach((slot) => {
            //get utc times
            //we will be updating start at the end as this will be our time tracker
            let start = moment.utc(dateISO + ' ' + slot.start)
            const end = moment.utc(dateISO + ' ' + slot.end)

            //loop to check if the duration fits the time slot
            while (start.isBefore(end)) {
                console.log('--------------------------------------------------WHILE------------------------------------------------')
                console.log('start', start)
                //get start and end times with duration of the appointment
                const clientStartHour = start.clone().add(durationBefore, 'minutes')
                const clientEndHour = clientStartHour.clone().add(duration, 'minutes')
                const endHour = clientEndHour.clone().add(durationAfter, 'minutes')

                //if the time given doesn't fit the appointment aka the appointment goes beyond the end time of the slot brea 
                if (endHour.isAfter(end)) {
                    break
                }

                //since we don't have any conflicts we push the data
                arrSlot.push({
                    startHour: start.toDate(),
                    endHour: endHour.toDate(),
                    clientStartHour: clientStartHour.toDate(),
                    clientEndHour: clientEndHour.toDate(),
                });

                //time tracker update
                //update start to the end time of the appointment/booking/exercise
                start = endHour.clone()
            }
        });

        //return the slots that will fit all the duration vars
        return arrSlot
    }

    let arrSlot = getSlots(availableSlots, dateISO, durationBefore, duration, durationAfter)
    console.log('REEEEEEEEEEEEEEEEEEEEEEEEEES', arrSlot)
    return arrSlot
}

module.exports = { getAvailableSpots }