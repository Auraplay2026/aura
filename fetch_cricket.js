const teams = [
    'Royal Challengers Bangalore', 'Rajasthan Royals', 'Punjab Kings', 'Sunrisers Hyderabad'
];
async function fetchLogos() {
    for (let team of teams) {
        const query = encodeURIComponent(team);
        try {
            const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${query}`);
            const data = await res.json();
            if (data && data.teams && data.teams[0] && data.teams[0].strBadge) {
                console.log(`"${team}": "${data.teams[0].strBadge}",`);
            } else {
                console.log(`// Not found: ${team}`);
            }
        } catch(e) {
            console.log(`// Error: ${team}`);
        }
    }
}
fetchLogos();
