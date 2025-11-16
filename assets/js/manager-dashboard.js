// Manager Dashboard JavaScript

$(document).ready(function() {
    const user = checkAuth();
    if (!user || user.role !== 'manager') {
        logout();
        return;
    }

    // Update user info
    $('#userName').text(user.name);
    const initials = user.name.split(' ').map(n => n[0]).join('');
    $('#userInitials').text(initials);

    // Get godown info
    const godowns = getGodowns();
    const godown = godowns.find(g => g.id === user.godown_id);
    if (godown) {
        $('#godownName').text(godown.name);
        $('#mobileGodownName').text(godown.name);
    }

    loadDashboardData();
});

function loadDashboardData() {
    const user = getCurrentUser();
    const trips = getTrips().filter(t => t.godown_id === user.godown_id);
    const deliveries = getDeliveries();
    const vehicles = getVehicles().filter(v => v.godown_id === user.godown_id);
    const inventory = getInventory().filter(i => i.godown_id === user.godown_id);

    // Update stats
    const activeTrips = trips.filter(t => t.status === 'ongoing');
    $('#activeTrips').text(activeTrips.length);

    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = deliveries.filter(d => {
        const trip = trips.find(t => t.id === d.trip_id);
        return trip && d.delivery_date === today;
    });
    $('#todayDeliveries').text(todayDeliveries.length);

    $('#totalVehicles').text(vehicles.length);

    const totalFilled = inventory.reduce((sum, item) => sum + item.filled, 0);
    $('#filledStock').text(totalFilled);

    // Load active trips
    loadActiveTrips(activeTrips);

    // Load inventory summary
    loadInventorySummary(inventory);
}

function loadActiveTrips(trips) {
    const vehicles = getVehicles();
    const drivers = getDrivers();
    const users = getUsers();

    let html = '';
    trips.forEach((trip, index) => {
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        const driver = users.find(u => u.id === trip.driver_id) || drivers.find(d => d.id === trip.driver_id);
        
        const startTime = new Date(trip.start_time);
        const timeStr = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const tripIcon = trip.trip_type === 'delivery' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>';

        html += `
            <div class="trip-card" onclick="window.location.href='manager-trip-details.html?id=${trip.id}'"
                 style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${tripIcon}
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${trip.dc_number}</h3>
                            <p class="text-sm text-gray-600">${trip.trip_type === 'delivery' ? 'Delivery Trip' : 'Refill Trip'}</p>
                        </div>
                    </div>
                    <span class="badge badge-success">
                        <span class="status-dot active"></span>
                        Ongoing
                    </span>
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
                <div class="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                    <span>Started: ${timeStr}</span>
                    <span>Start KM: ${trip.start_km}</span>
                </div>
            </div>
        `;
    });

    if (html === '') {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No active trips</p>
                <button class="btn btn-primary btn-sm mt-4" onclick="window.location.href='manager-create-trip.html?type=delivery'">
                    Create New Trip
                </button>
            </div>
        `;
    }

    $('#activeTripsList').html(html);
}

function loadInventorySummary(inventory) {
    // Group by provider
    const providers = {};
    
    inventory.forEach(item => {
        if (!providers[item.provider]) {
            providers[item.provider] = {
                filled: 0,
                empty: 0,
                in_transit: 0,
                damaged: 0
            };
        }
        providers[item.provider].filled += item.filled;
        providers[item.provider].empty += item.empty;
        providers[item.provider].in_transit += item.in_transit;
        providers[item.provider].damaged += item.damaged;
    });

    let html = '<div class="space-y-3">';
    
    Object.keys(providers).forEach((provider, index) => {
        const data = providers[provider];
        const total = data.filled + data.empty + data.in_transit;
        const filledPercentage = total > 0 ? Math.round((data.filled / total) * 100) : 0;

        html += `
            <div class="p-4 bg-gray-50 rounded-lg" style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-gray-900">${provider}</h3>
                    <span class="text-sm font-medium text-orange-600">${filledPercentage}% Filled</span>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Filled</p>
                        <p class="text-lg font-bold text-green-600">${data.filled}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Empty</p>
                        <p class="text-lg font-bold text-gray-600">${data.empty}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Transit</p>
                        <p class="text-lg font-bold text-orange-600">${data.in_transit}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Damaged</p>
                        <p class="text-lg font-bold text-red-600">${data.damaged}</p>
                    </div>
                </div>
                <div class="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all" 
                         style="width: ${filledPercentage}%"></div>
                </div>
            </div>
        `;
    });

    html += '</div>';

    if (Object.keys(providers).length === 0) {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                <p class="text-gray-500 font-medium">No inventory data</p>
            </div>
        `;
    }

    $('#inventorySummary').html(html);
}