function initMap() {
    const map = new google.maps.Map(document.getElementById("eventsMap"), {
        zoom: 8,
        center: { lat: 37.7749, lng: -122.4194 }, // Example location
    });

    // Add markers for events
    const markers = [
        { position: { lat: 37.7749, lng: -122.4194 }, title: "Event 1" },
        { position: { lat: 37.3382, lng: -121.8863 }, title: "Event 2" },
    ];

    markers.forEach(markerData => {
        new google.maps.Marker({
            position: markerData.position,
            map,
            title: markerData.title,
        });
    });
}
