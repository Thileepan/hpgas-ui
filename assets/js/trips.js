// Manager Trips List JavaScript
// UPDATED: Now using Supabase instead of localStorage

let currentFilter = 'all';

$(document).ready(async function() {  // ← Made async
    const user = checkAuth();
    if (!user || user.role !== 'manager') {
        logout();
        return;
    }

    // Update user info
    $('#userName').text(user.name);
    const initials = user.name.split(' ').map(n => n[0]).join('');
    $('#userInitials').text(initials);

    // Get godown info - UPDATED: Made async
    const godowns = await getGodowns();
    const godown = godowns.find(g => g.id === user.godown_id);
    if (godown) {
        $('#godownName').text(godown.name);
        $('#mobileGodownName').text(godown.name);
    }

    // Load trips
    await loadTrips();

    // Filter button handlers
    $('.trip-filter-btn').click(async function() {  // ← Made async
        $('.trip-filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        await loadTrips();  // ← Added await
    });
});

async function loadTrips() {  // ← Made async
    const user = getCurrentUser();
    let trips = (await getTrips()).filter(t => t.godown_id === user.godown_id);  // ← Added await
    
    // Apply filter
    if (currentFilter === 'ongoing') {
        trips = trips.filter(t => t.status === 'ongoing');
    } else if (currentFilter === 'completed') {
        trips = trips.filter(t => t.status === 'completed');
    } else if (currentFilter === 'delivery') {
        trips = trips.filter(t => t.trip_type === 'delivery');
    } else if (currentFilter === 'refill') {
        trips = trips.filter(t => t.trip_type === 'refill');
    }
    
    // Sort by created date (newest first)
    trips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (trips.length === 0) {
        $('#tripsList').hide();
        $('#emptyState').show();
        return;
    }
    
    $('#emptyState').hide();
    $('#tripsList').show();
    
    // UPDATED: Made all data fetching async
    const vehicles = await getVehicles();
    const drivers = await getDrivers();
    const users = await getUsers();
    const deliveries = await getDeliveries();
    const fillingStations = await getFillingStations();
    
    let html = '';
    
    trips.forEach((trip, index) => {
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        const driver = users.find(u => u.id === trip.driver_id) || drivers.find(d => d.id === trip.driver_id);
        
        const startTime = new Date(trip.start_time);
        const timeStr = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = startTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        // Count deliveries for this trip
        const tripDeliveries = deliveries.filter(d => d.trip_id === trip.id);
        
        // Calculate total cylinders
        const totalCylinders = trip.load_details.reduce((sum, item) => sum + item.quantity, 0);
        
        // Trip icon
        const tripIcon = trip.trip_type === 'delivery' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>';
        
        // Status badge
        const statusBadge = trip.status === 'ongoing' 
            ? '<span class="badge badge-success"><span class="status-dot active"></span>Ongoing</span>'
            : '<span class="badge badge-secondary">Completed</span>';
        
        // Trip type label
        const tripTypeLabel = trip.trip_type === 'delivery' ? 'Delivery Trip' : 'Refill Trip';
        
        // Get filling station name if refill trip
        let additionalInfo = '';
        if (trip.trip_type === 'refill' && trip.filling_station_id) {
            const station = fillingStations.find(s => s.id === trip.filling_station_id);
            additionalInfo = `
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>${station ? station.name : 'N/A'}</span>
                </div>
            `;
        }
        
        html += `
            <div class="trip-card animate-slide-up" style="animation-delay: ${index * 0.05}s" onclick="window.location.href='trip-details.html?id=${trip.id}'">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${tripIcon}
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${trip.dc_number}</h3>
                            <p class="text-sm text-gray-600">${tripTypeLabel}</p>
                        </div>
                    </div>
                    ${statusBadge}
                </div>
                
                <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Vehicle</p>
                        <p class="text-sm font-medium text-gray-900">${vehicle?.vehicle_number || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Driver</p>
                        <p class="text-sm font-medium text-gray-900">${driver?.name || 'N/A'}</p>
                    </div>
                </div>
                
                ${additionalInfo}
                
                <div class="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200 mt-3">
                    <div class="flex items-center gap-4">
                        <span>${dateStr}, ${timeStr}</span>
                        ${trip.status === 'ongoing' ? `
                            <span class="flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                ${tripDeliveries.length} deliveries
                            </span>
                        ` : ''}
                    </div>
                    <span class="font-medium text-gray-700">${totalCylinders} cylinders</span>
                </div>
            </div>
        `;
    });
    
    $('#tripsList').html(html);
}