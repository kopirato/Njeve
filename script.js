// Cheki Weather - script
const el = id => document.getElementById(id);
const btnSearch = el('btnSearch'), btnLoc = el('btnLoc');

const mockNow = {
  location: "Nairobi, KE",
  temp: 24,
  feels: 25,
  desc: "Partly cloudy",
  hum: 68,
  wind: 3.4,
  forecast: [
    {t: "In 3h", temp: 23, desc: "Clouds"},
    {t: "In 6h", temp: 22, desc: "Light Rain"},
    {t: "In 9h", temp: 21, desc: "Clear"}
  ]
};

function showData(d){
  el('weather').classList.remove('hidden');
  el('loc').textContent = d.location;
  el('temp').textContent = Math.round(d.temp) + '°C';
  el('desc').textContent = d.desc;
  el('feels').textContent = Math.round(d.feels) + '°C';
  el('hum').textContent = d.hum;
  el('wind').textContent = d.wind;
  const f = el('forecast');
  f.innerHTML = '';
  (d.forecast || []).slice(0,3).forEach(it=>{
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `<div style="font-weight:600">${it.t}</div><div>${Math.round(it.temp)}°C</div><div style="color:var(--muted)">${it.desc}</div>`;
    f.appendChild(div);
  });
}

function useMock(q){
  // friendly mock based on query string
  const copy = JSON.parse(JSON.stringify(mockNow));
  if(q) copy.location = q + ', --';
  return copy;
}

async function fetchOWMByCoords(lat, lon, apikey){
  const base = 'https://api.openweathermap.org/data/2.5';
  const u1 = `${base}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apikey}`;
  const u2 = `${base}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apikey}`;
  const [r1, r2] = await Promise.all([fetch(u1), fetch(u2)]);
  if(!r1.ok || !r2.ok) throw new Error('OpenWeatherMap error');
  const j1 = await r1.json();
  const j2 = await r2.json();
  const data = {
    location: j1.name + ', ' + (j1.sys && j1.sys.country || ''),
    temp: j1.main.temp,
    feels: j1.main.feels_like,
    desc: j1.weather && j1.weather[0] && j1.weather[0].description,
    hum: j1.main.humidity,
    wind: j1.wind.speed,
    forecast: (j2.list||[]).slice(0,3).map(it=>({t: it.dt_txt, temp: it.main.temp, desc: it.weather[0].description}))
  };
  return data;
}

async function fetchOWMByCity(q, apikey){
  const base = 'https://api.openweathermap.org/data/2.5';
  const u = `${base}/weather?q=${encodeURIComponent(q)}&units=metric&appid=${apikey}`;
  const r = await fetch(u);
  if(!r.ok) throw new Error('OpenWeatherMap error');
  const j = await r.json();
  return fetchOWMByCoords(j.coord.lat, j.coord.lon, apikey);
}

btnSearch.addEventListener('click', async ()=>{
  const q = el('search').value.trim();
  const apikey = el('apikey').value.trim();
  if(!q){
    alert('Type a city or use location');
    return;
  }
  if(!apikey){
    showData(useMock(q));
    return;
  }
  try{
    const d = await fetchOWMByCity(q, apikey);
    showData(d);
  }catch(e){
    console.error(e);
    alert('Could not fetch from OpenWeatherMap — showing mock data.');
    showData(useMock(q));
  }
});

btnLoc.addEventListener('click', ()=>{
  const apikey = el('apikey').value.trim();
  if(!navigator.geolocation){
    alert('Geolocation not supported. Showing mock data.');
    showData(useMock('Your location'));
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos=>{
    const {latitude, longitude} = pos.coords;
    if(!apikey){
      showData(useMock('Current location'));
      return;
    }
    try{
      const d = await fetchOWMByCoords(latitude, longitude, apikey);
      showData(d);
    }catch(e){
      console.error(e);
      alert('Could not fetch from OpenWeatherMap — showing mock data.');
      showData(useMock('Your location'));
    }
  }, err=>{
    console.warn(err);
    alert('Location denied or failed — showing mock data.');
    showData(useMock('Your location'));
  }, {timeout:8000});
});

// initial demo
showData(useMock('Nairobi'));
