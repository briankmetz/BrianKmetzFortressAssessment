# BrianKmetzFortressAssessment

## Solution

This solution has been coded using typescript. Clone this repo and enter ```npm install``` to install the required packages. Enter ```tsc solution.ts``` to compile the typescript code into javascript and enter ```node solution.js``` to run the compiled javascript code. The full list of reservations (both prior reservations and those made by the algorithm) are printed to the console. Be aware that reservation #8 printed by my algorithm differs from the one provided in answers.json. I believe my answer is correct. According to answers.json, reservation #8 should go to room id "56b687d3-f6b5-4632-9f65-c2f1cd3950bb" at a total charge of $98. My solution finds reservation #8 should go to room id "f8620433-c510-4d95-8005-691f6a030fe9" at a total charge of $55. Both rooms are 2 bed, non-smoking rooms. Both calculations for total charge are correct so the only reason to reserve the more expensive room would be if the cheaper room was booked from Jan 3rd to Jan 4th, which is not the case. The room does have prior bookings from Dec 31st to Jan 2nd and from Jan 2nd to Jan 3rd but even those bookings prove we are using standard hotel logic (checking out occurs in the morning and check out on Jan 3rd would not "block" a check in on Jan 3rd). If for some reason we did want such a same day "block" then this can be easily rectified by replacing both ```<=``` with ```<``` on line 47 of my typescript code. Rerunning with that change produces the expected answers found in answers.json

## Algorithm

This solution begins by breaking the hotel into smoking and nonsmoking room arrays. Since requests can only reserve one type of room with no overlap, it more efficient to partition the rooms so the algorithm does not waste time iterating over invalid rooms when processing a request. The room arrays are then sorted by their daily rate from least to greatest, this will improve the search later. Each room is represented by a class object with all the normal data points found in rooms.json and also a binary search tree representing the current reservations on that room (nodes are sorted by check in date and also carry the corresponding check out date). The reservations.json file is loaded and applied to the rooms (the algorithm assumes this data is good and does not check for invalid or overlapping reservations here). Then, in order, the requests are processed. Looking only at the rooms corresponding to the request's smoking preference, skipping over those with insufficent bed count, and starting from those with the lowest daily rate, the algorithm checks for room availability on the requested time frame. This is accomplished by performing a binary search on the existing reservations against the check in date. The proposed reservation is bounded by the reservation immediately on or before and immediately on or after it. So it compares the proposed timeframe against the check-out date of the lower bound and check-in date of the upper bound. If available, the algorithm keeps track of that room but continues iterating for a possible cheaper overall room. This iteration ends early if the daily rate of the current room being looked at is such that the cleaning fee would have to be negative to make that room cheaper. Because the rooms are sorted by daily rate, no further rooms need to be explored at that point. With the best room found, the reservation is placed. This continues until all requests are served.

## Questions

1. This assignment took a couple hours. As a matter of whiteboarding it is a very quick solution to layout and explain but it's easy to run into bugs during the actual implementation of the algorithm. As one example, the solution is supposed to use the YYYY-MM-DD strings to sort check-in dates into a binary search tree but at one point I was converting the strings into Datetime values and then inserting those into the tree instead of the string values. The bst allowed the insert but did not sort the nodes correctly when using Datetime over string which was an annoying problem to debug as the error occurred silently and messed up the output while still giving the impression everything was fine when printing the dates to the console. I did spend a decent amount of time considering other possible solutions. The binary search for room availability is pretty efficient but I expect it is possible to achieve constant time by reformulating the room availability as series of bits. Perhaps a dictionary of arrays eg. {'2020': Array<Number>(12), '2021': Array<Number>(12), ... } where the indexes of the arrays represent months and the numbers represent, in binary, the availability of the room on each day. Then bitwise operations could be performed on the numbers in constant time to shift and mask them until only those bits representing a particular timeframe remain. Then we can tell the room is available if that final number equals 0 (ie. all bits for all dates in the timeframe are 0). But that is certainly a lot of work to implement.
1. Let N be the number of rooms (or more precisely the max of num_smoking and num_non_smoking), M be the number of requests, and R be the maximum number of reservations on any one room. The runtime is O(N × M × log(R)). In the worst case, every request needs to iterate through every room and the time to check each room's availability is based on a binary search which is logarithmic. This will generally not be the case and depending on the room data, each request may end up expanding only a fraction of the total rooms to check their availability before determining the best room. Also the number of reservations on a room should generally be small (absolute maximum of 365 per year), so in general a few thousand requests on a hotel with a few hundred rooms should not be an issue to process.
1. This depends on how individual rooms adjust their pricing. Some factors likely affect all rooms proportionally so they would have no affect on the room chosen as the answer, only affecting the final price. But assuming there are some factors which unequally affect rooms, then the simplest implementation would be to calibrate those adjusts so they can only be positive or zero. Then we just expand the current "cleaning fee" logic by factoring all those adjusts into deciding when to stop searching for a better price. That is:
    1. First find the available room with the lowest daily rate.
    1. Continue working upwards looking for a better price until the daily rate has gotten so high, even if all other adjustments were zero the current room price would still be higher off the daily rate alone.
    1. At this point, no further rooms need to be explored.
