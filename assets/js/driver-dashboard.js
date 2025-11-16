// Driver Dashboard JavaScript

$(document).ready(function() {
    const user = checkAuth();
    if (!user || user.role !== 'driver') {
        logout();
        return;
    }

    // Update user info
    $('#userName').text(user.name);
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    $('#userInitials').text(initials);

    loadDashboardData();
});

function loadDashboardData() {
    const user = getCurrentUser();
    const trips = getTrips();
    const deliveries = getDeliveries();

    // Get driver's trips
    const driverTrips = trips.filter(t => t.driver_id === user.id);
    $('#totalTrips').text(driverTrips.length);

    // Get today's deliveries
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = deliveries.filter(d => {
        const trip = driverTrips.find(t => t.id === d.trip_id);
        return trip && d.delivery_date === today;
    });
    $('#todayDeliveries').text(todayDeliveries.length);

    // Check for active trip
    const activeTrip = driverTrips.find(t => t.status === 'ongoing');
    if (activeTrip) {
        loadCurrentTrip(activeTrip);
    }

    // Load recent deliveries
    loadRecentDeliveries(deliveries, driverTrips);
}

function loadCurrentTrip(trip) {
    const vehicles = getVehicles();
    const loadmen = getLoadmen();
    const users = getUsers();
    
    const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
    const loadman1 = users.find(u => u.id === trip.loadman1_id) || loadmen.find(l => l.id === trip.loadman1_id);
    const loadman2 = users.find(u => u.id === trip.loadman2_id) || loadmen.find(l => l.id === trip.loadman2_id);
    
    const startTime = new Date(trip.start_time);
    const now = new Date();
    const duration = Math.floor((now - startTime) / 1000 / 60); // minutes
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Count deliveries made in this trip
    const deliveries = getDeliveries();
    const tripDeliveries = deliveries.filter(d => d.trip_id === trip.id);

    const html = `
        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="text-white/80 text-sm mb-1">Current Trip</p>
                    <h2 class="text-2xl font-bold">${trip.dc_number}</h2>
                </div>
                <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center animate-pulse-slow">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <p class="text-white/70 text-xs mb-1">Duration</p>
                    <p class="font-semibold text-lg">${durationStr}</p>
                </div>
                <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <p class="text-white/70 text-xs mb-1">Deliveries</p>
                    <p class="font-semibold text-lg">${tripDeliveries.length}</p>
                </div>
            </div>

            <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span class="text-white/90">Vehicle: <strong>${vehicle?.vehicle_number || 'N/A'}</strong></span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-white/90">Started: <strong>${startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span class="text-white/90">Loadmen: <strong>${loadman1?.name || 'N/A'}${loadman2 ? ', ' + loadman2.name : ''}</strong></span>
                </div>
            </div>

            <button onclick="window.location.href='driver-trip.html'" 
                class="w-full bg-white text-orange-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors active:scale-95">
                View Trip Details
            </button>
        </div>
    `;

    $('#currentTripCard').html(html).show();
}

function loadRecentDeliveries(deliveries, driverTrips) {
    const customers = getCustomers();
    const tripIds = driverTrips.map(t => t.id);
    
    // Get recent deliveries for this driver
    const recentDeliveries = deliveries
        .filter(d => tripIds.includes(d.trip_id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    let html = '';
    
    if (recentDeliveries.length === 0) {
        html = `
            <div class="empty-state py-8">
                <svg class="empty-state-icon mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No deliveries yet</p>
                <p class="text-sm text-gray-400 mt-1">Your delivery history will appear here</p>
            </div>
        `;
    } else {
        recentDeliveries.forEach((delivery, index) => {
            const customer = customers.find(c => c.id === delivery.customer_id);
            const totalAmount = delivery.payments.reduce((sum, p) => sum + p.amount, 0);
            const deliveryDate = new Date(delivery.created_at);
            const timeStr = deliveryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const dateStr = deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

            // Count total cylinders delivered
            const totalCylinders = delivery.delivered_items.reduce((sum, item) => sum + item.quantity, 0);

            html += `
                <div class="delivery-item cursor-pointer hover:bg-gray-100 transition-colors"
                     onclick="window.location.href='driver-delivery-details.html?id=${delivery.id}'"
                     style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">${customer?.name || 'Unknown Customer'}</h4>
                            <p class="text-sm text-gray-600">${customer?.business_type || 'Commercial'}</p>
                        </div>
                        <span class="badge badge-success">Completed</span>
                    </div>
                    
                    <div class="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <div class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                            <span>${totalCylinders} cylinders</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="font-medium text-green-600">₹${totalAmount.toLocaleString()}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>${dateStr}, ${timeStr}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    $('#recentDeliveries').html(html);
}

function showTab(tab) {
    switch(tab) {
        case 'trip':
            window.location.href = 'driver-trip.html';
            break;
        case 'history':
            window.location.href = 'driver-history.html';
            break;
        case 'profile':
            window.location.href = 'driver-profile.html';
            break;
    }
}