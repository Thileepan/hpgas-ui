// Driver Trip Management JavaScript

let currentTrip = null;

$(document).ready(function() {
    const user = checkAuth();
    if (!user || user.role !== 'driver') {
        logout();
        return;
    }

    // Update user info
    $('#userName').text(user.name);
    const initials = user.name.split(' ').map(n => n[0]).join('');
    $('#userInitials').text(initials);

    loadActiveTrip();
});

function loadActiveTrip() {
    const user = getCurrentUser();
    const trips = getTrips();
    
    // Find active trip for this driver
    const activeTrip = trips.find(t => t.driver_id === user.id && t.status === 'ongoing');
    
    if (!activeTrip) {
        $('#noTripSection').removeClass('hidden');
        $('#activeTripContent').addClass('hidden');
        return;
    }
    
    currentTrip = activeTrip;
    $('#noTripSection').addClass('hidden');
    $('#activeTripContent').removeClass('hidden');
    
    // Update header
    $('#dcNumberHeader').text(activeTrip.dc_number);
    
    // Load trip status
    loadTripStatus(activeTrip);
    
    // Load trip info
    loadTripInfo(activeTrip);
    
    // Load vehicle and crew
    loadVehicleCrew(activeTrip);
    
    // Load current load
    loadCurrentLoad(activeTrip);
    
    // Load deliveries
    loadTripDeliveries(activeTrip);
}

function loadTripStatus(trip) {
    const startTime = new Date(trip.start_time);
    const now = new Date();
    const diffMs = now - startTime;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    
    const duration = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
    
    const html = `
        <div class="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span class="font-semibold">Trip in Progress</span>
                </div>
                <span class="text-sm bg-white/20 px-3 py-1 rounded-full">${duration}</span>
            </div>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs text-white/80">Started at</p>
                    <p class="font-semibold">${startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                    <p class="text-xs text-white/80">Start KM</p>
                    <p class="font-semibold">${trip.start_km} km</p>
                </div>
                <div>
                    <p class="text-xs text-white/80">Type</p>
                    <p class="font-semibold">${trip.trip_type === 'delivery' ? 'Delivery' : 'Refill'}</p>
                </div>
            </div>
        </div>
    `;
    
    $('#tripStatusCard').html(html);
}

function loadTripInfo(trip) {
    const godowns = getGodowns();
    const godown = godowns.find(g => g.id === trip.godown_id);
    
    let html = `
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">DC Number</span>
            <span class="font-semibold text-gray-900">${trip.dc_number}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Trip Type</span>
            <span class="badge ${trip.trip_type === 'delivery' ? 'badge-primary' : 'badge-secondary'}">${trip.trip_type === 'delivery' ? 'Delivery' : 'Refill'}</span>
        </div>
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Godown</span>
            <span class="font-semibold text-gray-900">${godown ? godown.name : 'N/A'}</span>
        </div>
        <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600">Start Time</span>
            <span class="font-semibold text-gray-900">${new Date(trip.start_time).toLocaleString('en-IN')}</span>
        </div>
    `;
    
    if (trip.trip_type === 'refill' && trip.filling_station_id) {
        const stations = getFillingStations();
        const station = stations.find(s => s.id === trip.filling_station_id);
        html += `
            <div class="flex items-center justify-between py-2 border-t border-gray-100 mt-2">
                <span class="text-sm text-gray-600">Filling Station</span>
                <span class="font-semibold text-gray-900">${station ? station.name : 'N/A'}</span>
            </div>
        `;
    }
    
    $('#tripInfo').html(html);
}

function loadVehicleCrew(trip) {
    const vehicles = getVehicles();
    const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
    
    const users = getUsers();
    const loadmen = getLoadmen();
    
    const driver = users.find(u => u.id === trip.driver_id);
    const loadman1 = loadmen.find(l => l.id === trip.loadman1_id);
    const loadman2 = loadmen.find(l => l.id === trip.loadman2_id);
    
    const html = `
        <div class="flex items-center gap-3 py-3 border-b border-gray-100">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
            </div>
            <div>
                <p class="text-sm text-gray-600">Vehicle</p>
                <p class="font-semibold text-gray-900">${vehicle ? `${vehicle.vehicle_number} (${vehicle.vehicle_type})` : 'N/A'}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 py-3 border-b border-gray-100">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
            </div>
            <div>
                <p class="text-sm text-gray-600">Driver</p>
                <p class="font-semibold text-gray-900">${driver ? driver.name : 'N/A'}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 py-3 border-b border-gray-100">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
            </div>
            <div>
                <p class="text-sm text-gray-600">Loadman 1</p>
                <p class="font-semibold text-gray-900">${loadman1 ? loadman1.name : 'Not Assigned'}</p>
            </div>
        </div>
        <div class="flex items-center gap-3 py-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
            </div>
            <div>
                <p class="text-sm text-gray-600">Loadman 2</p>
                <p class="font-semibold text-gray-900">${loadman2 ? loadman2.name : 'Not Assigned'}</p>
            </div>
        </div>
    `;
    
    $('#vehicleCrew').html(html);
}

function loadCurrentLoad(trip) {
    let totalFilled = 0;
    let totalEmpty = 0;
    
    trip.load_details.forEach(item => {
        if (item.type === 'filled') {
            totalFilled += item.quantity;
        } else if (item.type === 'empty') {
            totalEmpty += item.quantity;
        }
    });
    
    // Calculate delivered
    const deliveries = getDeliveries().filter(d => d.trip_id === trip.id);
    let delivered = 0;
    deliveries.forEach(d => {
        d.delivered_items.forEach(item => {
            delivered += item.quantity;
        });
    });
    
    const remaining = totalFilled - delivered;
    
    const summaryHtml = `
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Total Loaded</p>
            <p class="text-2xl font-bold text-gray-900">${totalFilled + totalEmpty}</p>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Delivered</p>
            <p class="text-2xl font-bold text-green-600">${delivered}</p>
        </div>
    `;
    
    $('#loadSummary').html(summaryHtml);
    
    // Detailed load
    let detailsHtml = '<div class="space-y-2">';
    trip.load_details.forEach(item => {
        detailsHtml += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <p class="font-semibold text-gray-900">${item.provider} ${item.kg}kg</p>
                    <p class="text-xs text-gray-500">${item.type === 'filled' ? 'Filled' : 'Empty'}</p>
                </div>
                <span class="text-lg font-bold text-gray-900">${item.quantity}</span>
            </div>
        `;
    });
    detailsHtml += '</div>';
    
    $('#loadDetails').html(detailsHtml);
}

function toggleLoadDetails() {
    const $details = $('#loadDetails');
    $details.slideToggle();
    
    const isVisible = $details.is(':visible');
    $('#loadToggleText').text(isVisible ? 'Hide Details' : 'Show Details');
}

function loadTripDeliveries(trip) {
    const deliveries = getDeliveries().filter(d => d.trip_id === trip.id);
    const customers = getCustomers();
    
    $('#deliveryCount').text(deliveries.length);
    
    if (deliveries.length === 0) {
        $('#deliveriesList').html(`
            <div class="text-center py-8">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-gray-500 text-sm">No deliveries made yet</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    deliveries.forEach((delivery, index) => {
        const customer = customers.find(c => c.id === delivery.customer_id);
        const time = new Date(delivery.delivery_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        let totalQty = 0;
        delivery.delivered_items.forEach(item => totalQty += item.quantity);
        
        let totalPayment = 0;
        if (delivery.payments) {
            delivery.payments.forEach(p => totalPayment += p.amount);
        }
        
        html += `
            <div class="p-4 bg-gray-50 rounded-lg" style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-900">${customer ? customer.name : 'Unknown'}</h4>
                    <span class="text-xs text-gray-500">${time}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">${totalQty} cylinders delivered</span>
                    <span class="font-semibold text-green-600">₹${totalPayment.toLocaleString('en-IN')}</span>
                </div>
            </div>
        `;
    });
    
    $('#deliveriesList').html(html);
    
    // Show end trip button if there are deliveries
    if (deliveries.length > 0) {
        $('#endTripSection').removeClass('hidden');
    }
}

function callManager() {
    const user = getCurrentUser();
    const godowns = getGodowns();
    const godown = godowns.find(g => g.id === user.godown_id);
    
    if (godown && godown.phone) {
        window.location.href = `tel:${godown.phone}`;
    } else {
        showToast('Manager contact not available', 'error');
    }
}

function openEndTripModal() {
    if (!currentTrip) return;
    
    $('#startKmDisplay').text(currentTrip.start_km);
    $('#endTripModal').removeClass('hidden');
}

function closeEndTripModal() {
    $('#endTripModal').addClass('hidden');
    $('#endKm').val('');
    $('#tripNotes').val('');
}

function submitEndTrip() {
    const endKm = parseInt($('#endKm').val());
    const notes = $('#tripNotes').val();
    
    if (!endKm || endKm < currentTrip.start_km) {
        showToast('Please enter valid ending KM', 'error');
        return;
    }
    
    // Update trip status to pending_closure (waiting for manager approval)
    const trips = getTrips();
    const tripIndex = trips.findIndex(t => t.id === currentTrip.id);
    
    if (tripIndex !== -1) {
        trips[tripIndex].end_km = endKm;
        trips[tripIndex].end_time = new Date().toISOString();
        trips[tripIndex].driver_notes = notes;
        trips[tripIndex].status = 'pending_closure'; // New status
        
        saveTrips(trips);
        
        showToast('Trip submitted to manager for approval', 'success');
        
        setTimeout(() => {
            window.location.href = 'driver-dashboard.html';
        }, 1500);
    }
}