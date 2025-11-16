// Manager Trip Details JavaScript

let currentTrip = null;

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
    }

    // Get trip ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = parseInt(urlParams.get('id'));

    if (!tripId) {
        showToast('Trip not found', 'error');
        setTimeout(() => {
            window.location.href = 'trips.html';
        }, 1500);
        return;
    }

    loadTripDetails(tripId);

    // Close trip form handler
    $('#closeTripForm').submit(function(e) {
        e.preventDefault();
        closeTrip();
    });
});

function loadTripDetails(tripId) {
    const trips = getTrips();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
        showToast('Trip not found', 'error');
        setTimeout(() => {
            window.location.href = 'trips.html';
        }, 1500);
        return;
    }

    currentTrip = trip;

    // Update header
    $('#dcNumberHeader').text(trip.dc_number);
    $('#tripTypeHeader').text(trip.trip_type === 'delivery' ? 'Delivery Trip' : 'Refill Trip');

    // Load all sections
    loadTripStatus(trip);
    loadTripInfo(trip);
    loadVehicleCrew(trip);
    loadLoadDetails(trip);
    
    if (trip.trip_type === 'delivery') {
        loadDeliveries(trip);
    }

    // Show close button if ongoing
    if (trip.status === 'ongoing') {
        $('#closeTripSection').show();
        $('#closeTripBtnMobile').html(`
            <button onclick="openCloseModal()" class="btn btn-primary btn-sm">
                Close Trip
            </button>
        `);
    }
}

function loadTripStatus(trip) {
    const startTime = new Date(trip.start_time);
    const now = new Date();
    
    let statusHtml = '';
    
    if (trip.status === 'ongoing') {
        const duration = Math.floor((now - startTime) / 1000 / 60); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

        statusHtml = `
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-xl">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <p class="text-white/80 text-sm mb-1">Trip Status</p>
                        <h2 class="text-2xl font-bold">Ongoing</h2>
                    </div>
                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center animate-pulse-slow">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p class="text-white/70 text-xs mb-1">Duration</p>
                        <p class="font-semibold text-lg">${durationStr}</p>
                    </div>
                    <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p class="text-white/70 text-xs mb-1">Started</p>
                        <p class="font-semibold text-lg">${startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        const endTime = new Date(trip.end_time);
        const duration = Math.floor((endTime - startTime) / 1000 / 60); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        const kmTravelled = trip.end_km - trip.start_km;

        statusHtml = `
            <div class="bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-5 text-white shadow-xl">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <p class="text-white/80 text-sm mb-1">Trip Status</p>
                        <h2 class="text-2xl font-bold">Completed</h2>
                    </div>
                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p class="text-white/70 text-xs mb-1">Duration</p>
                        <p class="font-semibold">${durationStr}</p>
                    </div>
                    <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p class="text-white/70 text-xs mb-1">Distance</p>
                        <p class="font-semibold">${kmTravelled} km</p>
                    </div>
                    <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <p class="text-white/70 text-xs mb-1">Completed</p>
                        <p class="font-semibold text-xs">${endTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                </div>
            </div>
        `;
    }

    $('#tripStatusCard').html(statusHtml);
}

function loadTripInfo(trip) {
    const startTime = new Date(trip.start_time);
    const endTime = trip.end_time ? new Date(trip.end_time) : null;

    let html = `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
                <span class="text-sm text-gray-600">DC Number</span>
            </div>
            <span class="font-semibold text-gray-900">${trip.dc_number}</span>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm text-gray-600">Start Time</span>
            </div>
            <span class="font-semibold text-gray-900">${startTime.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <span class="text-sm text-gray-600">Starting KM</span>
            </div>
            <span class="font-semibold text-gray-900">${trip.start_km} km</span>
        </div>
    `;

    if (endTime) {
        html += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-sm text-gray-600">End Time</span>
                </div>
                <span class="font-semibold text-gray-900">${endTime.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span class="text-sm text-gray-600">Ending KM</span>
                </div>
                <span class="font-semibold text-gray-900">${trip.end_km} km</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                    <span class="text-sm text-blue-700 font-medium">Total Distance</span>
                </div>
                <span class="font-bold text-blue-700">${trip.end_km - trip.start_km} km</span>
            </div>
        `;
    }

    // Add filling station info for refill trips
    if (trip.trip_type === 'refill' && trip.filling_station_id) {
        const stations = getFillingStations();
        const station = stations.find(s => s.id === trip.filling_station_id);
        
        if (station) {
            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span class="text-sm text-gray-600">Filling Station</span>
                    </div>
                    <span class="font-semibold text-gray-900">${station.name}</span>
                </div>
            `;
        }
    }

    $('#tripInfo').html(html);
}

function loadVehicleCrew(trip) {
    const vehicles = getVehicles();
    const drivers = getDrivers();
    const users = getUsers();
    const loadmen = getLoadmen();

    const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
    const driver = users.find(u => u.id === trip.driver_id) || drivers.find(d => d.id === trip.driver_id);
    const loadman1 = loadmen.find(l => l.id === trip.loadman1_id);
    const loadman2 = loadmen.find(l => l.id === trip.loadman2_id);

    let html = `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span class="text-sm text-gray-600">Vehicle</span>
            </div>
            <span class="font-semibold text-gray-900">${vehicle ? vehicle.vehicle_number + ' (' + vehicle.vehicle_type + ')' : 'N/A'}</span>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span class="text-sm text-gray-600">Driver</span>
            </div>
            <span class="font-semibold text-gray-900">${driver ? driver.name : 'N/A'}</span>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span class="text-sm text-gray-600">Loadman 1</span>
            </div>
            <span class="font-semibold text-gray-900">${loadman1 ? loadman1.name : 'Not assigned'}</span>
        </div>
    `;

    if (loadman2) {
        html += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span class="text-sm text-gray-600">Loadman 2</span>
                </div>
                <span class="font-semibold text-gray-900">${loadman2.name}</span>
            </div>
        `;
    }

    $('#vehicleCrew').html(html);
}

function loadLoadDetails(trip) {
    let html = '';

    trip.load_details.forEach((load, index) => {
        const typeColor = load.type === 'filled' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50';
        const typeIcon = load.type === 'filled' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>';

        html += `
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 ${typeColor} rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${typeIcon}
                            </svg>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">${load.provider} ${load.kg}kg</p>
                            <p class="text-xs text-gray-500 capitalize">${load.type}</p>
                        </div>
                    </div>
                    <span class="text-lg font-bold text-orange-600">${load.quantity}</span>
                </div>
            </div>
        `;
    });

    // Add filled details if available (for completed refill trips)
    if (trip.filled_details && trip.filled_details.length > 0) {
        html += `<div class="pt-3 mt-3 border-t border-gray-200">
            <p class="text-sm font-medium text-gray-700 mb-2">Filled Cylinders Received:</p>
        `;
        
        trip.filled_details.forEach(filled => {
            html += `
                <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <p class="font-semibold text-gray-900">${filled.provider} ${filled.kg}kg Filled</p>
                        </div>
                        <span class="text-lg font-bold text-green-600">${filled.quantity}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }

    // Add total count
    const totalCylinders = trip.load_details.reduce((sum, item) => sum + item.quantity, 0);
    html += `
        <div class="p-3 bg-orange-50 rounded-lg border-2 border-orange-200 mt-2">
            <div class="flex items-center justify-between">
                <span class="font-semibold text-orange-700">Total Cylinders</span>
                <span class="text-xl font-bold text-orange-600">${totalCylinders}</span>
            </div>
        </div>
    `;

    $('#loadDetails').html(html);
}

function loadDeliveries(trip) {
    const deliveries = getDeliveries().filter(d => d.trip_id === trip.id);

    if (deliveries.length === 0) {
        $('#deliveriesSection').hide();
        return;
    }

    $('#deliveriesSection').show();
    $('#deliveryCount').text(deliveries.length);

    const customers = getCustomers();
    let html = '';

    deliveries.forEach((delivery, index) => {
        const customer = customers.find(c => c.id === delivery.customer_id);
        const totalAmount = delivery.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalDelivered = delivery.delivered_items.reduce((sum, item) => sum + item.quantity, 0);
        
        const deliveryTime = new Date(delivery.created_at);
        const timeStr = deliveryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        html += `
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <h4 class="font-semibold text-gray-900">${customer ? customer.name : 'Unknown'}</h4>
                        <p class="text-xs text-gray-500">${timeStr}</p>
                    </div>
                    <span class="badge badge-success">Completed</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">${totalDelivered} cylinders</span>
                    <span class="font-semibold text-green-600">₹${totalAmount.toLocaleString()}</span>
                </div>
            </div>
        `;
    });

    $('#deliveriesList').html(html);
}

function openCloseModal() {
    if (!currentTrip) return;

    // Set current time as default
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    $('#endTime').val(dateTimeLocal);

    // Show starting KM
    $('#startKmDisplay').text(currentTrip.start_km + ' km');

    // For refill trips, show filled details input
    if (currentTrip.trip_type === 'refill') {
        $('#filledDetailsSection').show();
        let filledHtml = '';
        
        currentTrip.load_details.forEach((load, index) => {
            if (load.type === 'empty') {
                filledHtml += `
                    <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-sm font-medium text-gray-700">${load.provider} ${load.kg}kg Filled</label>
                            <input type="number" 
                                   class="filled-quantity w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                                   data-provider="${load.provider}" 
                                   data-kg="${load.kg}" 
                                   max="${load.quantity}" 
                                   value="${load.quantity}" 
                                   placeholder="0">
                        </div>
                        <p class="text-xs text-gray-500">Sent: ${load.quantity} empty cylinders</p>
                    </div>
                `;
            }
        });
        
        $('#filledDetailsContainer').html(filledHtml);
    } else {
        $('#filledDetailsSection').hide();
    }

    $('#closeTripModal').removeClass('hidden');
}

function closeModal() {
    $('#closeTripModal').addClass('hidden');
}

function closeTrip() {
    const endKm = parseInt($('#endKm').val());
    const endTime = $('#endTime').val();

    if (!endKm || endKm < currentTrip.start_km) {
        showToast('Invalid ending KM. Must be greater than starting KM.', 'error');
        return;
    }

    if (!endTime) {
        showToast('Please enter return time', 'error');
        return;
    }

    // Get filled details for refill trips
    let filledDetails = [];
    if (currentTrip.trip_type === 'refill') {
        $('.filled-quantity').each(function() {
            const provider = $(this).data('provider');
            const kg = $(this).data('kg');
            const quantity = parseInt($(this).val()) || 0;
            
            if (quantity > 0) {
                filledDetails.push({
                    provider: provider,
                    kg: kg.toString(),
                    type: 'filled',
                    quantity: quantity
                });
            }
        });
    }

    // Update trip
    const trips = getTrips();
    const tripIndex = trips.findIndex(t => t.id === currentTrip.id);
    
    if (tripIndex === -1) {
        showToast('Trip not found', 'error');
        return;
    }

    trips[tripIndex].end_km = endKm;
    trips[tripIndex].end_time = endTime;
    trips[tripIndex].status = 'completed';
    
    if (filledDetails.length > 0) {
        trips[tripIndex].filled_details = filledDetails;
    }

    saveTrips(trips);

    // Update inventory - move from in_transit back to stock
    updateInventoryOnClose(trips[tripIndex]);

    showToast('Trip closed successfully!', 'success');

    closeModal();

    // Reload page after short delay
    setTimeout(() => {
        location.reload();
    }, 1000);
}

function updateInventoryOnClose(trip) {
    const inventory = getInventory();
    
    // Move load details from in_transit back to stock
    trip.load_details.forEach(load => {
        const invItem = inventory.find(i => 
            i.godown_id === trip.godown_id &&
            i.provider === load.provider &&
            i.kg === load.kg
        );
        
        if (!invItem) return;
        
        // Reduce in_transit
        invItem.in_transit = Math.max(0, invItem.in_transit - load.quantity);
        
        // Add back to appropriate stock
        if (load.type === 'filled') {
            invItem.filled += load.quantity;
        } else if (load.type === 'empty') {
            invItem.empty += load.quantity;
        }
    });

    // For refill trips, add filled cylinders received
    if (trip.filled_details) {
        trip.filled_details.forEach(filled => {
            const invItem = inventory.find(i => 
                i.godown_id === trip.godown_id &&
                i.provider === filled.provider &&
                i.kg === filled.kg
            );
            
            if (invItem) {
                // The filled cylinders were counted as empty when leaving
                // Now we need to reduce empty and add to filled
                invItem.empty = Math.max(0, invItem.empty - filled.quantity);
                invItem.filled += filled.quantity;
            }
        });
    }
    
    saveInventory(inventory);
}