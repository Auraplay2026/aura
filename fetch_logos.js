const TEAMS = [
    // Soccer
    "Mohun Bagan SG", "Mumbai City FC", "Kerala Blasters FC", "Bengaluru FC", "FC Goa",
    "Chennaiyin FC", "Odisha FC", "East Bengal FC", "NorthEast United FC", "Hyderabad FC",
    "Jamshedpur FC", "Punjab FC", "Mohammedan SC", "Gokulam Kerala FC", "Real Kashmir FC",
    // Basketball
    "Chennai Slam", "Pune Peshwas", "Bengaluru Beast", "Mumbai Challengers", "Punjab Steelers",
    "Haryana Gold", "Hyderabad Sky", "Delhi Capitals Hoops", "Kochi Stars", "Ahmedabad Wingers",
    // Esports
    "Team Soul", "GodLike Esports", "Global Esports", "Entity Gaming", "Blind Esports",
    "Orangutan", "Revenant Esports", "Medal Esports", "Enigma Gaming", "Reckoning Esports",
    "Gods Reign", "Team XSpark", "Gladiators Esports", "Marcos Gaming", "Carnival Gaming"
];

async function fetchLogos() {
    let result = '';
    for (let team of TEAMS) {
        // format name for searching
        const query = encodeURIComponent(team.replace(' FC', '').replace(' SC', '').replace(' SG', ''));
        try {
            const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${query}`);
            const data = await res.json();
            if (data && data.teams && data.teams[0] && data.teams[0].strBadge) {
                result += `      "${team}": "${data.teams[0].strBadge}",\n`;
            } else {
                // fall back to clearbit
                result += `      "${team}": "https://logo.clearbit.com/${team.toLowerCase().replace(/ /g, '')}.com",\n`;
            }
        } catch(e) {
            result += `      "${team}": "https://logo.clearbit.com/${team.toLowerCase().replace(/ /g, '')}.com",\n`;
        }
    }
    console.log(result);
}

fetchLogos();
