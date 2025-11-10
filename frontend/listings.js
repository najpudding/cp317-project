function createSpot(price, address, dist, availability, notes) {
    const priceString = `$${price}/hour`;
    let distString = (dist > 60 ? Math.round(dist / 60 * 10) / 10 + " hr " : "") + (dist % 60) + " min"

    // this is just to decide between AM and PM for availability times 
    const availabilityString = "Available " + (availability[0] > 12 ? (availability[0] - 12) + "PM" : availability[0] + "AM") + "–" + (availability[1] > 12 ? (availability[1] - 12) + "PM" : availability[1] + "AM");

    const spotCard = document.createElement('div');
    spotCard.className = 'spot-card';
    spotCard.innerHTML = `
        <h3>${address} — ${priceString}</h3>
        <p>${distString} — ${availabilityString}</p>
        <button class="view-btn"
            data-address="${address}"
            data-price="${priceString}"
            data-walk="${distString}"
            data-availability="${availabilityString}"
            data-notes="${notes}"
        >View</button>
    `;
   
    const viewBtn = spotCard.querySelector('.view-btn');
    viewBtn.addEventListener('click', () => {
        window.parent.postMessage({
            type: 'openSpotModal',
            spot: { address, priceString, distString, availabilityString, notes }
        }, '*');
    });

    return spotCard;
}

const spotsList = document.querySelector('.spots-list');

//these will be obtained from server later, just hardcoded for now, format: [price, address, dist (in minutes), [availability start, availability end], notes]
const exampleValues = [
    [5, "123 King St N, Waterloo", 5, [14, 18], "Covered spot near campus and transit. Safe well-lit area."],
    [4, "45 University Ave W, Waterloo", 3, [8, 12], "Short-term spot; ideal for morning appointments."],
    [6, "10 Columbia St W, Waterloo", 7, [12, 8], "Drive-in access; electric vehicle charging nearby."],
    [3, "9 Erb St W, Waterloo", 2, [6, 10], "Cheap early-bird spot; limited evening availability."],
    [7, "200 University Ave W, Waterloo", 9, [4, 11], "Large lot with security patrols during the evening."],
    [5, "250 King St N, Waterloo", 6, [10, 3], "Covered parking; friendly host and fast responses."],
    [4.5, "15 Bridgeport Rd E, Kitchener", 62, [9, 5], "Large driveway spot; good for daytime commuters."],
    [6.5, "88 Frederick St, Kitchener", 8, [1, 9], "Near shopping and restaurants; convenient for evenings."],
    [5, "300 Weber St N, Kitchener", 10, [7, 1], "Spacious lot; perfect for morning shifts."],
    [3.5, "77 Victoria St S, Kitchener", 4, [3, 10], "Quiet residential street; host allows overnight parking by request."]
];

for (let i = 0; i < exampleValues.length; i++) {
    const [price, address, walk, availability, notes] = exampleValues[i];
    spotElement = createSpot(price, address, walk, availability, notes);
    spotsList.appendChild(spotElement);
}

