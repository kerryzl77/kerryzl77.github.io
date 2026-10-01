(function () {
  'use strict';
  var container = document.getElementById('places-map');
  if (!container || !window.L) return;
  var places = {
    guangzhou: { name: 'Guangzhou, China', point: [23.1291, 113.2644], zoom: 11, note: 'Where I grew up' },
    standrews: { name: 'St Andrews, Scotland', point: [56.3398, -2.7967], zoom: 13, note: 'Four years in the UK' },
    tennis: { name: 'Piedmont Community Tennis Courts', point: [37.8239783, -122.2338442], zoom: 16, note: 'Piedmont · 94611', url: 'https://www.google.com/maps?cid=7326452347255515209' },
    coro: { name: 'CoRo Coffee Room, Berkeley', point: [37.8624991, -122.2972602], zoom: 16, note: '2324 Fifth Street · Coffee' },
    sf: { name: 'San Francisco', point: [37.7749, -122.4194], zoom: 11, note: 'Home now' }
  };
  container.textContent = '';
  var map = L.map(container, { scrollWheelZoom: false, worldCopyJump: true }).setView(places.sf.point, 10);
  var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  var status = document.getElementById('places-status');
  var markers = {};
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  Object.keys(places).forEach(function (id) {
    var place = places[id];
    var popup = document.createElement('div');
    var title = document.createElement('strong'); title.textContent = place.name;
    var note = document.createElement('div'); note.textContent = place.note;
    var link = document.createElement('a'); link.textContent = 'Open in Google Maps';
    link.href = place.url || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place.name);
    link.target = '_blank'; link.rel = 'noopener';
    popup.append(title, note, link);
    markers[id] = L.marker(place.point, { title: place.name, alt: place.name,
      icon: L.divIcon({ className: 'place-marker', iconSize: [18,18], iconAnchor: [9,9] })
    }).addTo(map).bindPopup(popup);
    markers[id].on('click', function () { status.textContent = place.name + ' · ' + place.note; });
  });
  document.querySelectorAll('[data-place]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var id = link.dataset.place, place = places[id];
      if (!place) return;
      event.preventDefault();
      map.setView(place.point, place.zoom, { animate: !reducedMotion.matches });
      markers[id].openPopup();
      status.textContent = place.name + ' · ' + place.note;
      container.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
  });
  var all = document.getElementById('places-all'); all.hidden = false;
  all.addEventListener('click', function () {
    map.closePopup();
    map.fitBounds(Object.keys(places).map(function (id) { return places[id].point; }), { padding: [28,28], animate: !reducedMotion.matches });
    status.textContent = 'Guangzhou · St Andrews · San Francisco · CoRo · Piedmont';
  });
  tiles.on('tileerror', function () { status.textContent = 'Map tiles unavailable. Place markers still link to Google Maps.'; });
  if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize(); }).observe(container);
}());
