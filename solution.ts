import { readFileSync } from 'fs'
import { BinarySearchTree } from '@datastructures-js/binary-search-tree'

type BedCount = 1 | 2

interface RawRoomData {
    id: string,
    num_beds: BedCount,
    allow_smoking: boolean,
    daily_rate: number,
    cleaning_fee: number
}

class Room {
    public readonly id: string
    public readonly smoking: boolean
    public readonly beds: BedCount
    public readonly rate: number
    public readonly fee: number
    private availabilityTree: BinarySearchTree<string, string>

    constructor (room: RawRoomData) {
        this.id = room.id
        this.smoking = room.allow_smoking
        this.beds = room.num_beds
        this.rate = room.daily_rate
        this.fee = room.cleaning_fee
        this.availabilityTree = new BinarySearchTree()
    }

    /*
        Checks if room is fully available for a proposed timeframe.
        Arguments: checkin <YYYY-MM-DD string>, checkout <YYYY-MM-DD string>
        Return: boolean
    */
    hasAvailability (checkin: string, checkout: string) : boolean {
        // get the last reservation beginning ON or BEFORE this check in  
        var lastReservation = this.availabilityTree.lowerBound(checkin)
        // get the next reservation beginning ON or BEFORE this check in
        var nextReservation = this.availabilityTree.upperBound(checkin)

        // get check out of last reservation and check in of next reservation
        var lastCheckOut = (lastReservation != null) ? lastReservation.getValue() : "0001-01-01"
        var nextCheckIn = (nextReservation != null) ? nextReservation.getKey() : "9999-12-31"

        // check for reservation overlap
        if ( (lastCheckOut <= checkin) && (checkout <= nextCheckIn) ) {
            // room is available during the proposed timeframe
            return true
        } else {
            // room is not available during the timeframe
            return false
        }
    }

    /*
        Reserves room for a given timeframe.
        Arguments: checkin <YYYY-MM-DD string>, checkout <YYYY-MM-DD string>
        Return: void
    */
    bookReservation (checkin: string, checkout: string) : void {
        // insert new node into tree representing the check in/out dates
        this.availabilityTree.insert(checkin, checkout)
    }
}

console.log("Starting...")

// load json data
let rawRoomData = readFileSync('rooms.json', 'utf-8')
let rooms = JSON.parse(rawRoomData.toString())
let rawReservationData = readFileSync('reservations.json', 'utf-8')
let reservations = JSON.parse(rawReservationData.toString())
let rawRequestData = readFileSync('requests.json', 'utf-8')
let requests = JSON.parse(rawRequestData.toString())

// instantiate hotel object
let hotel = {
    smoking: [],
    nonsmoking: []
}

// load preexisting room & reservation data into hotel
for (var i in rooms) {
    // create room instance
    var newRoom = new Room(rooms[i])

    // find existing reservations on this room
    var bookings = reservations.filter(reservation => reservation.room_id == newRoom.id)

    // apply existing reservations to the room (could check availability as we go to ensure input data isn't bad but we'll trust there's no overlap in the input data)
    for (var j in bookings) {
        newRoom.bookReservation(bookings[j].checkin_date, bookings[j].checkout_date)
    }

    // add room to hotel (partitioned into smoking/nonsmoking sections)
    if (rooms[i].allow_smoking) {
        hotel.smoking.push(newRoom)
    } else {
        hotel.nonsmoking.push(newRoom)
    }
}

// sort rooms from lowest daily rate to highest (this will speed up finding the cheapest room)
hotel.smoking.sort((room1, room2) => room1.rate - room2.rate)
hotel.nonsmoking.sort((room1, room2) => room1.rate - room2.rate)

// process requests and assign rooms
for (var i in requests) {
    // get next request
    var request = requests[i]

    // only looking at rooms of the matching smoking type
    var hotelKey = (request.is_smoker) ? "smoking" : "nonsmoking"

    // calculate duration of stay
    var checkin = request.checkin_date
    var checkout = request.checkout_date
    var checkinDate = new Date(checkin)
    var checkoutDate = new Date(checkout)
    var numDays = (checkoutDate.getTime() - checkinDate.getTime())/ (1000 * 3600 * 24)

    // search through rooms & find best room to book a reservation
    var bestRoomIndex = -1
    var bestPrice = Infinity
    for (var j in hotel[hotelKey]) {
        // get next room
        var nextRoom = hotel[hotelKey][j]

        // if an available room is found, we can stop looking for a better room once the cleaning fee would have to be negative to find a cheaper room
        if (bestRoomIndex >= 0 && nextRoom.rate > bestPrice / numDays) {
            break
        }

        // skip over rooms with insufficent bed count
        if (nextRoom.beds < request.min_beds) {
            continue
        }

        // check room availability
        if (nextRoom.hasAvailability(checkin, checkout)) {
            // room is available, check price
            var price = (nextRoom.rate * numDays) + nextRoom.fee
            if (price < bestPrice) {
                bestRoomIndex = +j
                bestPrice = price
            }
        }
    }

    // if a valid room could be found, book the reservation
    if (bestRoomIndex >= 0) {
        // create entry in the reservation tree for the room
        hotel[hotelKey][bestRoomIndex].bookReservation(checkin, checkout)

        // add reservation to the output
        reservations.push({
            room_id: hotel[hotelKey][bestRoomIndex].id,
            checkin_date: checkin,
            checkout_date: checkout,
            total_charge: bestPrice
        })
    } else {
        // won't happen with the test data but just in case
        console.log("A valid reservation could not be made for request id: " + request.id)
    }
}

console.log("Complete. Final list of reservations:")
console.log(reservations)
