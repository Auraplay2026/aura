const run = async () => {
  const urls = [
    { name: 'Live Scores', url: 'https://www.thesportsdb.com/api/v1/json/3/livescores.php' },
    { name: 'IPL Cricket Next', url: 'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4480' },
    { name: 'EPL Soccer Next', url: 'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328' }
  ];

  for (const item of urls) {
    console.log(`Fetching ${item.name}...`);
    try {
      const res = await fetch(item.url);
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      console.log(`Keys:`, Object.keys(data));
      if (data.events) {
        console.log(`Found ${data.events.length} events.`);
        console.log(`First Event: ${data.events[0].strEvent} (${data.events[0].dateEvent})`);
      } else if (data.livescores) {
        console.log(`Found ${data.livescores.length} live scores.`);
      } else {
        console.log(`Response:`, JSON.stringify(data).substring(0, 200));
      }
      console.log('');
    } catch (err) {
      console.error(`Error fetching ${item.name}:`, err.message);
    }
  }
};

run();
