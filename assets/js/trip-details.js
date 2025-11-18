// Manager Trip Details JavaScript
// UPDATED: Now using Supabase with Customer Place tracking

let currentTrip = null;

$(document).ready(async function() {
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
    const godowns = await getGodowns();
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

    await loadTripDetails(tripId);

    // Close trip form handler
    $('#closeTripForm').submit(async function(e) {
        e.preventDefault();
        await closeTrip();
    });
});

async function loadTripDetails(tripId) {
    const trips = await getTrips();
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
    await loadTripInfo(trip);
    await loadVehicleCrew(trip);
    loadLoadDetails(trip);
    
    if (trip.trip_type === 'delivery') {
        await loadDeliveries(trip);
    }

    // Show close button if ongoing
    if (trip.status === 'ongoing') {
        $('#closeTripSection').show();
        $('#closeTripBtnMobile').html(`
            <button onclick="openCloseModal()" class="btn btn-primary btn-sm" id="closeTripBtnMobileBtn" disabled>
                Close Trip
            </button>
        `);
    }
    
    // Load delivery summary for delivery trips (both ongoing and completed)
    if (trip.trip_type === 'delivery') {
        await loadDeliverySummary(trip);
    }
}

// ==================== DELIVERY SUMMARY ====================

async function loadDeliverySummary(trip) {
    $('#deliverySummarySection').show();
    
    // Update header based on trip status
    if (trip.status === 'completed') {
        $('#deliverySummarySection .card > div:first-child h3').text('Trip Summary Report');
        $('#deliverySummarySection .card > div:first-child .badge').removeClass('badge-warning').addClass('badge-success').text('Completed');
    }
    
    const deliveries = await getDeliveries();
    const tripDeliveries = deliveries.filter(d => d.trip_id === trip.id);
    
    // Calculate summary data
    const summary = {
        delivered: {},
        emptyCollected: {},
        damaged: {},
        payments: {
            cash: 0,
            upi: 0,
            cheque: 0,
            total: 0,
            pending: 0
        }
    };
    
    let totalDeliveries = tripDeliveries.length;
    let totalCylindersDelivered = 0;
    let totalEmptiesCollected = 0;
    let totalDamagedCollected = 0;
    
    // Process each delivery
    tripDeliveries.forEach(delivery => {
        // Count delivered items
        delivery.delivered_items.forEach(item => {
            const key = `${item.provider}_${item.kg}`;
            if (!summary.delivered[key]) {
                summary.delivered[key] = { provider: item.provider, kg: item.kg, quantity: 0 };
            }
            summary.delivered[key].quantity += item.quantity;
            totalCylindersDelivered += item.quantity;
        });
        
        // Count empty cylinders collected
        if (delivery.empty_collected && delivery.empty_collected.length > 0) {
            delivery.empty_collected.forEach(item => {
                const key = `${item.provider}_${item.kg}`;
                if (!summary.emptyCollected[key]) {
                    summary.emptyCollected[key] = { provider: item.provider, kg: item.kg, quantity: 0 };
                }
                summary.emptyCollected[key].quantity += item.quantity;
                totalEmptiesCollected += item.quantity;
            });
        }
        
        // Count damaged cylinders
        if (delivery.return_collected && delivery.return_collected.length > 0) {
            delivery.return_collected.forEach(item => {
                const key = `${item.provider}_${item.kg}`;
                if (!summary.damaged[key]) {
                    summary.damaged[key] = { provider: item.provider, kg: item.kg, quantity: 0 };
                }
                // Count the actual quantity of damaged cylinders
                const qty = parseInt(item.quantity) || 1;
                summary.damaged[key].quantity += qty;
                totalDamagedCollected += qty;
            });
        }
        
        // Calculate payments - Using payments array structure
        if (delivery.payments && Array.isArray(delivery.payments)) {
            delivery.payments.forEach(payment => {
                const amount = parseFloat(payment.amount) || 0;
                
                if (amount > 0) {
                    summary.payments.total += amount;
                    
                    switch(payment.mode) {
                        case 'cash':
                            summary.payments.cash += amount;
                            break;
                        case 'upi':
                            summary.payments.upi += amount;
                            break;
                        case 'cheque':
                            summary.payments.cheque += amount;
                            break;
                    }
                }
            });
        }
    });
    
    console.log('Payment Summary Calculated:', summary.payments);
    console.log('Damaged Summary:', summary.damaged);
    console.log('Sample delivery data:', tripDeliveries[0]);
    console.log('Total deliveries processed:', tripDeliveries.length);
    
    // Update summary stats
    $('#summaryTotalDeliveries').text(totalDeliveries);
    $('#summaryCylindersDelivered').text(totalCylindersDelivered);
    $('#summaryEmptiesCollected').text(totalEmptiesCollected);
    $('#summaryDamagedCollected').text(totalDamagedCollected);
    
    // Build delivered breakdown table
    let deliveredHtml = '';
    trip.load_details.forEach(load => {
        if (load.type === 'filled') {
            const key = `${load.provider}_${load.kg}`;
            const delivered = summary.delivered[key] ? summary.delivered[key].quantity : 0;
            const undelivered = load.quantity - delivered;
            
            deliveredHtml += `
                <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 font-medium text-gray-900">${load.provider}</td>
                    <td class="px-3 py-2 text-gray-700">${load.kg} kg</td>
                    <td class="px-3 py-2 text-right text-blue-600 font-semibold">${load.quantity}</td>
                    <td class="px-3 py-2 text-right text-green-600 font-semibold">${delivered}</td>
                    <td class="px-3 py-2 text-right ${undelivered > 0 ? 'text-orange-600' : 'text-gray-600'} font-semibold">${undelivered}</td>
                </tr>
            `;
        }
    });
    
    if (deliveredHtml === '') {
        deliveredHtml = '<tr><td colspan="5" class="px-3 py-4 text-center text-gray-500">No data</td></tr>';
    }
    $('#deliveredBreakdownTable').html(deliveredHtml);
    
    // Build empty collected table
    let emptyHtml = '';
    Object.values(summary.emptyCollected).forEach(item => {
        emptyHtml += `
            <tr class="hover:bg-gray-50">
                <td class="px-3 py-2 font-medium text-gray-900">${item.provider}</td>
                <td class="px-3 py-2 text-gray-700">${item.kg} kg</td>
                <td class="px-3 py-2 text-right text-orange-600 font-semibold">${item.quantity}</td>
            </tr>
        `;
    });
    
    if (emptyHtml === '') {
        emptyHtml = '<tr><td colspan="3" class="px-3 py-4 text-center text-gray-500">No empty cylinders collected</td></tr>';
    }
    $('#emptyCollectedTable').html(emptyHtml);
    
    console.log('Damaged cylinders data:', summary.damaged);
    console.log('Damaged count:', Object.keys(summary.damaged).length);
    
    // Build damaged collected table
    let damagedHtml = '';
    Object.values(summary.damaged).forEach(item => {
        damagedHtml += `
            <tr class="hover:bg-gray-50">
                <td class="px-3 py-2 font-medium text-gray-900">${item.provider}</td>
                <td class="px-3 py-2 text-gray-700">${item.kg} kg</td>
                <td class="px-3 py-2 text-right text-red-600 font-semibold">${item.quantity}</td>
            </tr>
        `;
    });
    
    if (damagedHtml === '') {
        damagedHtml = '<tr><td colspan="3" class="px-3 py-4 text-center text-gray-500">No damaged cylinders collected</td></tr>';
    }
    
    $('#damagedSection').show();
    $('#damagedCollectedTable').html(damagedHtml);
    
    // Update payment summary
    $('#paymentCash').text('₹' + summary.payments.cash.toLocaleString('en-IN'));
    $('#paymentUPI').text('₹' + summary.payments.upi.toLocaleString('en-IN'));
    $('#paymentCheque').text('₹' + summary.payments.cheque.toLocaleString('en-IN'));
    $('#paymentTotal').text('₹' + (summary.payments.cash + summary.payments.upi + summary.payments.cheque).toLocaleString('en-IN'));
    
    // Hide pending payment section if not used
    if (summary.payments.pending > 0) {
        $('#paymentPendingSection').show();
        $('#paymentPending').text('₹' + summary.payments.pending.toLocaleString('en-IN'));
    } else {
        $('#paymentPendingSection').hide();
    }
    
    // Show/hide verification section based on trip status
    if (trip.status === 'ongoing') {
        $('#verificationSection').show();
        
        // Setup verification checkbox handler
        $('#verifySummary').change(function() {
            const isChecked = $(this).is(':checked');
            $('#closeTripBtn').prop('disabled', !isChecked);
            $('#closeTripBtnMobileBtn').prop('disabled', !isChecked);
            
            if (isChecked) {
                $('#closeTripBtn').removeClass('opacity-50 cursor-not-allowed');
                $('#closeTripBtnMobileBtn').removeClass('opacity-50 cursor-not-allowed');
                $('#verifyMessage').text('Summary verified. You can now close the trip.');
                $('#verifyMessage').removeClass('text-gray-500').addClass('text-green-600');
            } else {
                $('#closeTripBtn').addClass('opacity-50 cursor-not-allowed');
                $('#closeTripBtnMobileBtn').addClass('opacity-50 cursor-not-allowed');
                $('#verifyMessage').text('Please verify the summary above to enable trip closure');
                $('#verifyMessage').removeClass('text-green-600').addClass('text-gray-500');
            }
        });
        
        // Add disabled styling initially
        $('#closeTripBtn').addClass('opacity-50 cursor-not-allowed');
        if ($('#closeTripBtnMobileBtn').length) {
            $('#closeTripBtnMobileBtn').addClass('opacity-50 cursor-not-allowed');
        }
    } else {
        // Hide verification section for completed trips
        $('#verificationSection').hide();
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

async function loadTripInfo(trip) {
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
        const stations = await getFillingStations();
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

async function loadVehicleCrew(trip) {
    const vehicles = await getVehicles();
    const drivers = await getDrivers();
    const users = await getUsers();
    const loadmen = await getLoadmen();

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
                    <span class="text-xl font-bold text-gray-900">${load.quantity}</span>
                </div>
            </div>
        `;
    });

    $('#loadDetails').html(html);
}

async function loadDeliveries(trip) {
    const deliveries = (await getDeliveries()).filter(d => d.trip_id === trip.id);

    if (deliveries.length === 0) {
        $('#deliveriesSection').hide();
        return;
    }

    $('#deliveriesSection').show();
    $('#deliveryCount').text(deliveries.length);

    const customers = await getCustomers();
    let html = '';

    deliveries.forEach((delivery, index) => {
        const customer = customers.find(c => c.id === delivery.customer_id);
        const totalAmount = delivery.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalDelivered = delivery.delivered_items.reduce((sum, item) => sum + item.quantity, 0);
        
        const deliveryTime = new Date(delivery.created_at);
        const timeStr = deliveryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        html += `
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-orange-300 transition-all" onclick="viewDeliveryDetails(${delivery.id})">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-semibold text-gray-900">${customer ? customer.name : 'Unknown'}</h4>
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                        </div>
                        <p class="text-xs text-gray-500">${timeStr} • ${customer ? customer.business_type : ''}</p>
                    </div>
                    <span class="badge badge-success">Completed</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">${totalDelivered} cylinders delivered</span>
                    <span class="font-semibold text-green-600">₹${totalAmount.toLocaleString()}</span>
                </div>
            </div>
        `;
    });

    $('#deliveriesList').html(html);
}

// ==================== CLOSE TRIP ====================

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

    $('#closeModal').removeClass('hidden');
}

function closeModal() {
    $('#closeModal').addClass('hidden');
}

async function closeTrip() {
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
    const trips = await getTrips();
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

    await saveTrips(trips);

    // Update inventory - move from in_transit back to stock
    await reconcileInventoryOnTripClose(trips[tripIndex]);

    showToast('Trip closed successfully!', 'success');

    closeModal();

    // Reload page after short delay
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// ==================== DELIVERY DETAIL MODAL ====================

let currentDelivery = null;
let currentDeliveryCustomer = null;
let isEditMode = false;

async function viewDeliveryDetails(deliveryId) {
    const deliveries = await getDeliveries();
    currentDelivery = deliveries.find(d => d.id === deliveryId);
    
    if (!currentDelivery) {
        showToast('Delivery not found', 'error');
        return;
    }
    
    // Get customer info
    const customers = await getCustomers();
    currentDeliveryCustomer = customers.find(c => c.id === currentDelivery.customer_id);
    
    // Reset edit mode
    isEditMode = false;
    $('#editDeliveryBtn').show();
    $('#saveDeliveryBtn').hide();
    $('#cancelEditBtn').hide();
    
    // Update modal title
    $('#deliveryModalTitle').text(`Delivery to ${currentDeliveryCustomer ? currentDeliveryCustomer.name : 'Customer'}`);
    $('#deliveryModalSubtitle').text(`Delivery ID: #${deliveryId} • ${new Date(currentDelivery.created_at).toLocaleString('en-IN')}`);
    
    // Build modal content
    renderDeliveryContent();
    
    // Show modal
    $('#deliveryDetailModal').removeClass('hidden');
}

function renderDeliveryContent() {
    if (!currentDelivery || !currentDeliveryCustomer) return;
    
    const deliveryDate = new Date(currentDelivery.created_at);
    const totalAmount = currentDelivery.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDelivered = currentDelivery.delivered_items.reduce((sum, item) => sum + item.quantity, 0);
    const totalEmpty = currentDelivery.empty_collected ? currentDelivery.empty_collected.reduce((sum, item) => sum + item.quantity, 0) : 0;
    const totalReturns = currentDelivery.return_collected ? currentDelivery.return_collected.length : 0;
    
    let html = `
        <!-- Customer Information -->
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                Customer Information
            </h4>
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex items-start gap-3">
                    <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                    </div>
                    <div class="flex-1">
                        <h5 class="text-lg font-bold text-gray-900 mb-1">${currentDeliveryCustomer.name}</h5>
                        <p class="text-sm text-gray-600 mb-3">${currentDeliveryCustomer.business_type}</p>
                        <div class="space-y-2">
                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <p class="text-sm text-gray-700">${currentDeliveryCustomer.address}</p>
                            </div>
                            <div class="flex items-center gap-4">
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                    <a href="tel:${currentDeliveryCustomer.phone}" class="text-sm text-orange-600 font-medium hover:underline">${currentDeliveryCustomer.phone}</a>
                                </div>
                                ${currentDeliveryCustomer.whatsapp ? `
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                    </svg>
                                    <a href="https://wa.me/${currentDeliveryCustomer.whatsapp.replace(/\D/g, '')}" target="_blank" class="text-sm text-green-600 font-medium hover:underline">${currentDeliveryCustomer.whatsapp}</a>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delivery Summary -->
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Delivery Summary
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p class="text-xs text-green-700 mb-1">Cylinders Delivered</p>
                    <p class="text-2xl font-bold text-green-900">${totalDelivered}</p>
                </div>
                <div class="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p class="text-xs text-orange-700 mb-1">Empties Collected</p>
                    <p class="text-2xl font-bold text-orange-900">${totalEmpty}</p>
                </div>
                <div class="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p class="text-xs text-red-700 mb-1">Damaged Returns</p>
                    <p class="text-2xl font-bold text-red-900">${totalReturns}</p>
                </div>
                <div class="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p class="text-xs text-purple-700 mb-1">Total Payment</p>
                    <p class="text-2xl font-bold text-purple-900">₹${totalAmount.toLocaleString()}</p>
                </div>
            </div>
        </div>

        <!-- Delivered Items -->
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Cylinders Delivered (${totalDelivered} items)
            </h4>
            <div id="deliveredItemsView" class="space-y-2">
                ${renderDeliveredItems()}
            </div>
        </div>

        <!-- Empty Collected -->
        ${currentDelivery.empty_collected && currentDelivery.empty_collected.length > 0 ? `
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                </svg>
                Empty Cylinders Collected (${totalEmpty} items)
            </h4>
            <div id="emptyItemsView" class="space-y-2">
                ${renderEmptyItems()}
            </div>
        </div>
        ` : '<div class="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">No empty cylinders collected</div>'}

        <!-- Damaged/Return Collected -->
        ${currentDelivery.return_collected && currentDelivery.return_collected.length > 0 ? `
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                Damaged Cylinders Collected (${totalReturns} items)
            </h4>
            <div id="returnItemsView" class="space-y-2">
                ${renderReturnItems()}
            </div>
        </div>
        ` : '<div class="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">No damaged cylinders collected</div>'}

        <!-- Payments -->
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                Payment Details (₹${totalAmount.toLocaleString()})
            </h4>
            <div id="paymentsView" class="space-y-2">
                ${renderPayments()}
            </div>
        </div>

        <!-- Delivery Photos -->
        ${currentDelivery.photos && currentDelivery.photos.length > 0 ? `
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Delivery Photos (${currentDelivery.photos.length})
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                ${currentDelivery.photos.map((photo, idx) => `
                    <div class="relative group">
                        <img src="${photo}" alt="Delivery Photo ${idx + 1}" class="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity" onclick="viewFullImage('${photo}')">
                        <div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">${idx + 1}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : '<div class="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">No delivery photos captured</div>'}

        <!-- Delivery Location -->
        ${currentDelivery.latitude && currentDelivery.longitude ? `
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Delivery Location
            </h4>
            <div class="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-600">Latitude: <span class="font-semibold text-gray-900">${currentDelivery.latitude.toFixed(6)}</span></p>
                    <p class="text-sm text-gray-600">Longitude: <span class="font-semibold text-gray-900">${currentDelivery.longitude.toFixed(6)}</span></p>
                </div>
                <a href="https://www.google.com/maps?q=${currentDelivery.latitude},${currentDelivery.longitude}" target="_blank" class="btn btn-secondary btn-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                    </svg>
                    View on Map
                </a>
            </div>
        </div>
        ` : ''}

        <!-- Notes -->
        ${currentDelivery.notes ? `
        <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                </svg>
                Delivery Notes
            </h4>
            <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-gray-900">${currentDelivery.notes}</p>
            </div>
        </div>
        ` : ''}
    `;
    
    $('#deliveryDetailContent').html(html);
}

function renderDeliveredItems() {
    if (!currentDelivery || !currentDelivery.delivered_items) return '';
    
    return currentDelivery.delivered_items.map((item, idx) => `
        <div class="p-3 bg-green-50 rounded-lg border border-green-200" data-item-index="${idx}">
            <div class="flex items-center justify-between">
                <div class="flex-1 grid grid-cols-3 gap-4">
                    ${isEditMode ? `
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Provider</label>
                            <select class="edit-delivered-provider w-full px-2 py-1 border rounded text-sm">
                                <option value="HP" ${item.provider === 'HP' ? 'selected' : ''}>HP</option>
                                <option value="Indane" ${item.provider === 'Indane' ? 'selected' : ''}>Indane</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Size (kg)</label>
                            <select class="edit-delivered-kg w-full px-2 py-1 border rounded text-sm">
                                <option value="5" ${item.kg == '5' ? 'selected' : ''}>5 kg</option>
                                <option value="19" ${item.kg == '19' ? 'selected' : ''}>19 kg</option>
                                <option value="35" ${item.kg == '35' ? 'selected' : ''}>35 kg</option>
                                <option value="47.5" ${item.kg == '47.5' ? 'selected' : ''}>47.5 kg</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Quantity</label>
                            <input type="number" class="edit-delivered-quantity w-full px-2 py-1 border rounded text-sm" value="${item.quantity}" min="1">
                        </div>
                    ` : `
                        <div>
                            <p class="text-xs text-gray-600">Provider</p>
                            <p class="font-semibold text-gray-900">${item.provider}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Size</p>
                            <p class="font-semibold text-gray-900">${item.kg} kg</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Quantity</p>
                            <p class="font-semibold text-gray-900">${item.quantity}</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `).join('');
}

function renderEmptyItems() {
    if (!currentDelivery || !currentDelivery.empty_collected) return '';
    
    return currentDelivery.empty_collected.map((item, idx) => `
        <div class="p-3 bg-orange-50 rounded-lg border border-orange-200" data-item-index="${idx}">
            <div class="flex items-center justify-between">
                <div class="flex-1 grid grid-cols-3 gap-4">
                    ${isEditMode ? `
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Provider</label>
                            <select class="edit-empty-provider w-full px-2 py-1 border rounded text-sm">
                                <option value="HP" ${item.provider === 'HP' ? 'selected' : ''}>HP</option>
                                <option value="Indane" ${item.provider === 'Indane' ? 'selected' : ''}>Indane</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Size (kg)</label>
                            <select class="edit-empty-kg w-full px-2 py-1 border rounded text-sm">
                                <option value="5" ${item.kg == '5' ? 'selected' : ''}>5 kg</option>
                                <option value="19" ${item.kg == '19' ? 'selected' : ''}>19 kg</option>
                                <option value="35" ${item.kg == '35' ? 'selected' : ''}>35 kg</option>
                                <option value="47.5" ${item.kg == '47.5' ? 'selected' : ''}>47.5 kg</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Quantity</label>
                            <input type="number" class="edit-empty-quantity w-full px-2 py-1 border rounded text-sm" value="${item.quantity}" min="0">
                        </div>
                    ` : `
                        <div>
                            <p class="text-xs text-gray-600">Provider</p>
                            <p class="font-semibold text-gray-900">${item.provider}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Size</p>
                            <p class="font-semibold text-gray-900">${item.kg} kg</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Quantity</p>
                            <p class="font-semibold text-gray-900">${item.quantity}</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `).join('');
}

function renderReturnItems() {
    if (!currentDelivery || !currentDelivery.return_collected) return '';
    
    return currentDelivery.return_collected.map((item, idx) => `
        <div class="p-3 bg-red-50 rounded-lg border border-red-200" data-item-index="${idx}">
            <div class="flex items-center gap-4">
                <div class="flex-1 grid grid-cols-2 gap-4">
                    ${isEditMode ? `
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Provider</label>
                            <select class="edit-return-provider w-full px-2 py-1 border rounded text-sm">
                                <option value="HP" ${item.provider === 'HP' ? 'selected' : ''}>HP</option>
                                <option value="Indane" ${item.provider === 'Indane' ? 'selected' : ''}>Indane</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Size (kg)</label>
                            <select class="edit-return-kg w-full px-2 py-1 border rounded text-sm">
                                <option value="5" ${item.kg == '5' ? 'selected' : ''}>5 kg</option>
                                <option value="19" ${item.kg == '19' ? 'selected' : ''}>19 kg</option>
                                <option value="35" ${item.kg == '35' ? 'selected' : ''}>35 kg</option>
                                <option value="47.5" ${item.kg == '47.5' ? 'selected' : ''}>47.5 kg</option>
                            </select>
                        </div>
                    ` : `
                        <div>
                            <p class="text-xs text-gray-600">Provider</p>
                            <p class="font-semibold text-gray-900">${item.provider}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Size</p>
                            <p class="font-semibold text-gray-900">${item.kg} kg</p>
                        </div>
                    `}
                </div>
                ${item.photo ? `
                    <img src="${item.photo}" alt="Damaged Cylinder" class="w-20 h-20 object-cover rounded border border-red-300 cursor-pointer" onclick="viewFullImage('${item.photo}')">
                ` : '<div class="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Photo</div>'}
            </div>
        </div>
    `).join('');
}

function renderPayments() {
    if (!currentDelivery || !currentDelivery.payments) return '';
    
    return currentDelivery.payments.map((payment, idx) => `
        <div class="p-3 bg-purple-50 rounded-lg border border-purple-200" data-item-index="${idx}">
            <div class="flex items-center gap-4">
                <div class="flex-1 grid grid-cols-3 gap-4">
                    ${isEditMode ? `
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Mode</label>
                            <select class="edit-payment-mode w-full px-2 py-1 border rounded text-sm">
                                <option value="cash" ${payment.mode === 'cash' ? 'selected' : ''}>Cash</option>
                                <option value="upi" ${payment.mode === 'upi' ? 'selected' : ''}>UPI</option>
                                <option value="cheque" ${payment.mode === 'cheque' ? 'selected' : ''}>Cheque</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Amount (₹)</label>
                            <input type="number" class="edit-payment-amount w-full px-2 py-1 border rounded text-sm" value="${payment.amount}" min="0" step="0.01">
                        </div>
                        <div>
                            <label class="text-xs text-gray-600 block mb-1">Reference</label>
                            <input type="text" class="edit-payment-reference w-full px-2 py-1 border rounded text-sm" value="${payment.reference || ''}" placeholder="Optional">
                        </div>
                    ` : `
                        <div>
                            <p class="text-xs text-gray-600">Mode</p>
                            <p class="font-semibold text-gray-900 uppercase">${payment.mode}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Amount</p>
                            <p class="font-semibold text-gray-900">₹${payment.amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600">Reference</p>
                            <p class="font-semibold text-gray-900">${payment.reference || 'N/A'}</p>
                        </div>
                    `}
                </div>
                ${payment.photo ? `
                    <img src="${payment.photo}" alt="Payment Proof" class="w-20 h-20 object-cover rounded border border-purple-300 cursor-pointer" onclick="viewFullImage('${payment.photo}')">
                ` : (payment.mode !== 'cash' ? '<div class="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">No Proof</div>' : '')}
            </div>
        </div>
    `).join('');
}

function viewFullImage(imageUrl) {
    // Create a simple modal to view full image
    const modal = $(`
        <div class="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4" onclick="$(this).fadeOut(300, function() { $(this).remove(); })">
            <img src="${imageUrl}" class="max-w-full max-h-full object-contain rounded-lg">
            <button class="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `);
    $('body').append(modal);
    modal.hide().fadeIn(300);
}

function closeDeliveryModal() {
    $('#deliveryDetailModal').addClass('hidden');
    currentDelivery = null;
    currentDeliveryCustomer = null;
    isEditMode = false;
}

function toggleEditMode() {
    isEditMode = true;
    $('#editDeliveryBtn').hide();
    $('#saveDeliveryBtn').show();
    $('#cancelEditBtn').show();
    renderDeliveryContent();
    showToast('Edit mode enabled. Make your changes and click Save.', 'info');
}

function cancelEditMode() {
    isEditMode = false;
    $('#editDeliveryBtn').show();
    $('#saveDeliveryBtn').hide();
    $('#cancelEditBtn').hide();
    renderDeliveryContent();
}

async function saveDeliveryChanges() {
    if (!currentDelivery) return;
    
    // Collect updated delivered items
    const updatedDelivered = [];
    $('#deliveredItemsView > div').each(function() {
        const provider = $(this).find('.edit-delivered-provider').val();
        const kg = $(this).find('.edit-delivered-kg').val();
        const quantity = parseInt($(this).find('.edit-delivered-quantity').val());
        
        if (provider && kg && quantity > 0) {
            updatedDelivered.push({ provider, kg, quantity });
        }
    });
    
    // Collect updated empty items
    const updatedEmpty = [];
    $('#emptyItemsView > div').each(function() {
        const provider = $(this).find('.edit-empty-provider').val();
        const kg = $(this).find('.edit-empty-kg').val();
        const quantity = parseInt($(this).find('.edit-empty-quantity').val());
        
        if (provider && kg && quantity >= 0) {
            updatedEmpty.push({ provider, kg, quantity });
        }
    });
    
    // Collect updated return items (keep photos)
    const updatedReturns = [];
    $('#returnItemsView > div').each(function(index) {
        const provider = $(this).find('.edit-return-provider').val();
        const kg = $(this).find('.edit-return-kg').val();
        const photo = currentDelivery.return_collected[index].photo; // Keep existing photo
        
        if (provider && kg) {
            updatedReturns.push({ provider, kg, photo });
        }
    });
    
    // Collect updated payments (keep photos)
    const updatedPayments = [];
    $('#paymentsView > div').each(function(index) {
        const mode = $(this).find('.edit-payment-mode').val();
        const amount = parseFloat($(this).find('.edit-payment-amount').val());
        const reference = $(this).find('.edit-payment-reference').val();
        const photo = currentDelivery.payments[index].photo; // Keep existing photo
        
        if (mode && amount > 0) {
            updatedPayments.push({ 
                mode, 
                amount, 
                reference: reference || null,
                photo: photo || null
            });
        }
    });
    
    // Validation
    if (updatedDelivered.length === 0) {
        showToast('At least one delivered item is required', 'error');
        return;
    }
    
    if (updatedPayments.length === 0) {
        showToast('At least one payment is required', 'error');
        return;
    }
    
    // Update the delivery object
    currentDelivery.delivered_items = updatedDelivered;
    currentDelivery.empty_collected = updatedEmpty;
    currentDelivery.return_collected = updatedReturns;
    currentDelivery.payments = updatedPayments;
    
    // Save to database
    try {
        const deliveries = await getDeliveries();
        const index = deliveries.findIndex(d => d.id === currentDelivery.id);
        
        if (index !== -1) {
            deliveries[index] = currentDelivery;
            await saveDeliveries(deliveries);
            
            showToast('Delivery updated successfully!', 'success');
            
            // Exit edit mode and refresh view
            isEditMode = false;
            $('#editDeliveryBtn').show();
            $('#saveDeliveryBtn').hide();
            $('#cancelEditBtn').hide();
            renderDeliveryContent();
            
            // Reload the trip details to reflect changes
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    } catch (error) {
        console.error('Error saving delivery changes:', error);
        showToast('Error saving changes. Please try again.', 'error');
    }
}

async function reconcileInventoryOnTripClose(trip) {
    console.log('\n=== INVENTORY RECONCILIATION ON TRIP CLOSE ===');
    console.log('Trip:', trip.dc_number, '| Type:', trip.trip_type);
    
    let inventory = await getInventory();
    
    if (trip.trip_type === 'delivery') {
        // ===== DELIVERY TRIP CLOSURE =====
        console.log('Processing delivery trip closure');
        
        // Get all deliveries for this trip
        const deliveries = await getDeliveries();
        const tripDeliveries = deliveries.filter(d => d.trip_id === trip.id);
        
        console.log('Total deliveries in trip:', tripDeliveries.length);
        
        // Calculate totals from ALL deliveries
        const summary = {
            delivered: {}, // Cylinders delivered to customers
            emptyCollected: {}, // Empty cylinders collected from customers
            damaged: {} // Damaged cylinders collected
        };
        
        // Process all deliveries
        tripDeliveries.forEach(delivery => {
            // Count delivered items
            delivery.delivered_items.forEach(item => {
                const key = `${item.provider}_${item.kg}`;
                if (!summary.delivered[key]) {
                    summary.delivered[key] = { provider: item.provider, kg: item.kg, quantity: 0 };
                }
                summary.delivered[key].quantity += item.quantity;
            });
            
            // Count empty cylinders collected
            if (delivery.empty_collected && delivery.empty_collected.length > 0) {
                delivery.empty_collected.forEach(item => {
                    const key = `${item.provider}_${item.kg}`;
                    if (!summary.emptyCollected[key]) {
                        summary.emptyCollected[key] = { provider: item.provider, kg: item.kg, quantity: 0 };
                    }
                    summary.emptyCollected[key].quantity += item.quantity;
                });
            }
            
            // Count damaged cylinders (from return_collected with damage indication)
            if (delivery.return_collected && delivery.return_collected.length > 0) {
                delivery.return_collected.forEach(item => {
                    const key = `${item.provider}_${item.kg}`;
                    if (!summary.damaged[key]) {
                        summary.damaged[key] = { provider: item.provider, kg: item.kg, quantity: 0 };
                    }
                    summary.damaged[key].quantity += 1; // Each return item is 1 damaged cylinder
                });
            }
        });
        
        console.log('Delivery Summary:', summary);
        
        // Process each loaded cylinder type
        trip.load_details.forEach(load => {
            const invItem = inventory.find(i => 
                i.godown_id === trip.godown_id &&
                i.provider === load.provider &&
                parseFloat(i.kg) === parseFloat(load.kg)
            );
            
            if (!invItem) {
                console.warn(`Inventory item not found: ${load.provider} ${load.kg}kg`);
                return;
            }
            
            if (load.type === 'filled') {
                const key = `${load.provider}_${load.kg}`;
                
                // Get actual numbers
                const loaded = load.quantity;
                const delivered = summary.delivered[key] ? summary.delivered[key].quantity : 0;
                const emptyCollected = summary.emptyCollected[key] ? summary.emptyCollected[key].quantity : 0;
                const damaged = summary.damaged[key] ? summary.damaged[key].quantity : 0;
                
                // Calculate undelivered (returning to godown as filled)
                const undelivered = loaded - delivered;
                
                console.log(`\n${load.provider} ${load.kg}kg Reconciliation:`);
                console.log(`  Loaded: ${loaded}`);
                console.log(`  Delivered: ${delivered}`);
                console.log(`  Empty Collected: ${emptyCollected}`);
                console.log(`  Damaged: ${damaged}`);
                console.log(`  Undelivered (returning): ${undelivered}`);
                
                // Update inventory:
                
                // 1. Return UNDELIVERED filled cylinders to godown
                if (undelivered > 0) {
                    invItem.in_transit = Math.max(0, invItem.in_transit - undelivered);
                    invItem.filled += undelivered;
                    console.log(`  → Returned ${undelivered} filled to godown`);
                }
                
                // 2. Empty cylinders collected - remove from in_transit, add to empty stock
                if (emptyCollected > 0) {
                    invItem.in_transit = Math.max(0, invItem.in_transit - emptyCollected);
                    invItem.empty += emptyCollected;
                    console.log(`  → Removed ${emptyCollected} from in_transit and added to empty stock`);
                }
                
                // 3. Damaged cylinders collected - remove from in_transit, add to damaged
                if (damaged > 0) {
                    invItem.in_transit = Math.max(0, invItem.in_transit - damaged);
                    invItem.damaged += damaged;
                    console.log(`  → Added ${damaged} to damaged`);
                }
                
                // 4. Cylinders still at customer place (delivered but not returned as empty or damaged)
                const stillAtCustomer = delivered - emptyCollected - damaged;
                if (stillAtCustomer > 0) {
                    // Remove from in_transit and add to customer_place
                    invItem.in_transit = Math.max(0, invItem.in_transit - stillAtCustomer);
                    invItem.customer_place = (invItem.customer_place || 0) + stillAtCustomer;
                    console.log(`  → Moved ${stillAtCustomer} to customer place`);
                }
                
                console.log(`  Final: Filled=${invItem.filled}, Empty=${invItem.empty}, In Transit=${invItem.in_transit}, Customer Place=${invItem.customer_place || 0}, Damaged=${invItem.damaged}`);
            } else if (load.type === 'empty') {
                // Empty cylinders loaded (rare, but handle it)
                const key = `${load.provider}_${load.kg}`;
                const loaded = load.quantity;
                
                // Return empties to godown (they weren't delivered)
                invItem.in_transit = Math.max(0, invItem.in_transit - loaded);
                invItem.empty += loaded;
                console.log(`${load.provider} ${load.kg}kg: Returned ${loaded} empty to godown`);
            }
        });
        
    } else if (trip.trip_type === 'refill') {
        // ===== REFILL TRIP CLOSURE =====
        console.log('Processing refill trip closure');
        
        trip.load_details.forEach(load => {
            const invItem = inventory.find(i => 
                i.godown_id === trip.godown_id &&
                i.provider === load.provider &&
                parseFloat(i.kg) === parseFloat(load.kg)
            );
            
            if (!invItem) {
                console.warn(`Inventory item not found: ${load.provider} ${load.kg}kg`);
                return;
            }
            
            // Remove empties from in_transit (they went to filling station)
            if (load.type === 'empty') {
                const loaded = load.quantity;
                invItem.in_transit = Math.max(0, invItem.in_transit - loaded);
                console.log(`${load.provider} ${load.kg}kg: Removed ${loaded} empty from in_transit`);
            }
        });
        
        // Add filled cylinders received from filling station
        if (trip.filled_details && trip.filled_details.length > 0) {
            trip.filled_details.forEach(filled => {
                const invItem = inventory.find(i => 
                    i.godown_id === trip.godown_id &&
                    i.provider === filled.provider &&
                    parseFloat(i.kg) === parseFloat(filled.kg)
                );
                
                if (invItem) {
                    invItem.filled += filled.quantity;
                    console.log(`${filled.provider} ${filled.kg}kg: Added ${filled.quantity} filled from refill station`);
                }
            });
            
            // Calculate damaged/not refilled
            const totalSent = trip.load_details.reduce((sum, load) => {
                return load.type === 'empty' ? sum + load.quantity : sum;
            }, 0);
            const totalReceived = trip.filled_details.reduce((sum, item) => sum + item.quantity, 0);
            const notRefilled = totalSent - totalReceived;
            
            if (notRefilled > 0) {
                console.log(`Note: ${notRefilled} cylinders not refilled (possibly damaged)`);
                // Optionally track these as damaged
            }
        }
    }
    
    await saveInventory(inventory);
    console.log('=== INVENTORY RECONCILIATION COMPLETE ===\n');
}