// Driver Trip Management JavaScript
// UPDATED: Now using Supabase with async/await instead of localStorage

let currentTrip = null;

$(document).ready(async function() {  // ← Made async
    const user = checkAuth();
    if (!user || user.role !== 'driver') {
        logout();
        return;
    }

    // Update user info
    $('#userName').text(user.name);
    const initials = user.name.split(' ').map(n => n[0]).join('');
    $('#userInitials').text(initials);

    await loadActiveTrip();  // ← Added await
    
    // Auto-refresh every 10 seconds to show new deliveries
    setInterval(async function() {  // ← Made async
        if (currentTrip) {
            console.log('Auto-refreshing deliveries for trip:', currentTrip.dc_number);
            await loadTripDeliveries(currentTrip);  // ← Added await
            await loadCurrentLoad(currentTrip);  // ← Added await - Also refresh load to show delivered count
        }
    }, 10000); // Changed to 10 seconds for faster updates
});

async function loadActiveTrip() {  // ← Made async
    const user = getCurrentUser();
    // UPDATED: Made data fetching async
    const trips = await getTrips();  // ← Added await
    
    // Find active trip for this driver - GET THE LATEST ONE BY CREATED_AT
    const activeTrips = trips
        .filter(t => t.driver_id === user.id && t.status === 'ongoing')
        .sort((a, b) => {
            // Sort by created_at descending (newest first)
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB - dateA;
        });
    
    if (activeTrips.length === 0) {
        $('#noTripSection').removeClass('hidden');
        $('#activeTripContent').addClass('hidden');
        return;
    }
    
    const activeTrip = activeTrips[0]; // Get the most recently created trip
    currentTrip = activeTrip;
    
    console.log('Active trip loaded:', activeTrip.dc_number, 'Created at:', activeTrip.created_at);
    
    $('#noTripSection').addClass('hidden');
    $('#activeTripContent').removeClass('hidden');
    
    // Update header
    $('#dcNumberHeader').text(activeTrip.dc_number);
    
    // Load trip status
    loadTripStatus(activeTrip);
    
    // Load trip info
    await loadTripInfo(activeTrip);  // ← Added await
    
    // Load vehicle and crew
    await loadVehicleCrew(activeTrip);  // ← Added await
    
    // Load current load
    await loadCurrentLoad(activeTrip);  // ← Added await
    
    // Load deliveries
    await loadTripDeliveries(activeTrip);  // ← Added await
}

function loadTripStatus(trip) {
    const startTime = new Date(trip.start_time);
    const now = new Date();
    const diffMs = now - startTime;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    
    const duration = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
    
    // Check if trip was created in the last 30 minutes
    const createdAt = new Date(trip.created_at);
    const timeSinceCreation = Math.floor((now - createdAt) / 1000 / 60); // minutes
    const isNew = timeSinceCreation <= 30;
    
    const html = `
        <div class="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span class="font-semibold">Trip in Progress</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-sm bg-white/20 px-3 py-1 rounded-full">${duration}</span>
                    ${isNew ? '<span class="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full animate-pulse">NEW</span>' : ''}
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <p class="text-xs text-white/80">Started at</p>
                    <p class="font-semibold text-sm">${startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div>
                    <p class="text-xs text-white/80">Start KM</p>
                    <p class="font-semibold text-sm">${trip.start_km} km</p>
                </div>
                <div>
                    <p class="text-xs text-white/80">Type</p>
                    <p class="font-semibold text-sm">${trip.trip_type === 'delivery' ? 'Delivery' : 'Refill'}</p>
                </div>
            </div>
            ${isNew ? `
            <div class="flex items-center gap-2 text-xs bg-yellow-400/20 rounded-lg p-2 mt-3">
                <svg class="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-yellow-100">New trip created ${timeSinceCreation} minute${timeSinceCreation !== 1 ? 's' : ''} ago by manager</span>
            </div>
            ` : ''}
        </div>
    `;
    
    $('#tripStatusCard').html(html);
}

async function loadTripInfo(trip) {  // ← Made async
    // UPDATED: Made data fetching async
    const godowns = await getGodowns();  // ← Added await
    const godown = godowns.find(g => g.id === trip.godown_id);
    
    const startDate = new Date(trip.start_time);
    const dateStr = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
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
        <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-gray-600">Start Date</span>
            <span class="font-semibold text-gray-900">${dateStr}</span>
        </div>
        <div class="flex items-center justify-between py-2">
            <span class="text-sm text-gray-600">Start Time</span>
            <span class="font-semibold text-gray-900">${timeStr}</span>
        </div>
    `;
    
    // Show filling station for refill trips
    if (trip.trip_type === 'refill' && trip.filling_station_id) {
        const stations = await getFillingStations();  // ← Added await
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

async function loadVehicleCrew(trip) {  // ← Made async
    // UPDATED: Made all data fetching async
    const vehicles = await getVehicles();  // ← Added await
    const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
    
    const users = await getUsers();  // ← Added await
    const loadmen = await getLoadmen();  // ← Added await
    
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

async function loadCurrentLoad(trip) {  // ← Made async
    // Calculate totals from load_details
    let totalFilled = 0;
    let totalEmpty = 0;
    
    trip.load_details.forEach(item => {
        if (item.type === 'filled') {
            totalFilled += item.quantity;
        } else if (item.type === 'empty') {
            totalEmpty += item.quantity;
        }
    });
    
    // Calculate delivered from actual deliveries
    // UPDATED: Made data fetching async
    const deliveries = (await getDeliveries()).filter(d => d.trip_id === trip.id);  // ← Added await
    let delivered = 0;
    deliveries.forEach(d => {
        d.delivered_items.forEach(item => {
            delivered += item.quantity;
        });
    });
    
    const remaining = totalFilled - delivered;
    const totalLoaded = totalFilled + totalEmpty;
    
    const summaryHtml = `
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Total Loaded</p>
            <p class="text-2xl font-bold text-gray-900">${totalLoaded}</p>
        </div>
        <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Delivered</p>
            <p class="text-2xl font-bold text-green-600">${delivered}</p>
        </div>
    `;
    
    $('#loadSummary').html(summaryHtml);
    
    // Detailed load - show load_details from trip
    let detailsHtml = '<div class="space-y-2">';
    trip.load_details.forEach(item => {
        const typeLabel = item.type === 'filled' ? 'Filled' : 'Empty';
        const typeColor = item.type === 'filled' ? 'text-green-600' : 'text-gray-600';
        
        detailsHtml += `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                    <p class="font-semibold text-gray-900">${item.provider} ${item.kg}kg</p>
                    <p class="text-xs ${typeColor}">${typeLabel}</p>
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

async function loadTripDeliveries(trip) {  // ← Made async
    // UPDATED: Made all data fetching async
    const deliveries = (await getDeliveries()).filter(d => d.trip_id === trip.id);  // ← Added await
    const customers = await getCustomers();  // ← Added await
    
    console.log('Loading deliveries for trip', trip.id, '- Found:', deliveries.length);
    
    $('#deliveryCount').text(deliveries.length);
    
    if (deliveries.length === 0) {
        $('#deliveriesList').html(`
            <div class="text-center py-8">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-gray-500 text-sm font-medium">No deliveries made yet</p>
                <p class="text-xs text-gray-400 mt-1">Start making deliveries to track them here</p>
                <button onclick="loadActiveTrip()" class="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Refresh Now
                </button>
            </div>
        `);
        $('#endTripSection').addClass('hidden');
        return;
    }
    
    // Sort deliveries by created_at (newest first)
    deliveries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    let html = '';
    deliveries.forEach((delivery, index) => {
        const customer = customers.find(c => c.id === delivery.customer_id);
        const deliveryDateTime = new Date(delivery.created_at);
        const time = deliveryDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        let totalQty = 0;
        delivery.delivered_items.forEach(item => totalQty += item.quantity);
        
        let totalPayment = 0;
        if (delivery.payments && delivery.payments.length > 0) {
            delivery.payments.forEach(p => totalPayment += p.amount);
        }
        
        // Check if delivery is new (created in last 30 seconds)
        const now = new Date();
        const timeSinceDelivery = Math.floor((now - deliveryDateTime) / 1000);
        const isNewDelivery = timeSinceDelivery <= 30;
        
        html += `
            <div class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${isNewDelivery ? 'ring-2 ring-green-500' : ''}" 
                 style="animation: slideUp 0.5s ease-out ${index * 0.1}s both"
                 onclick="viewDeliveryDetail(${delivery.id})">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <h4 class="font-semibold text-gray-900">${customer ? customer.name : 'Unknown Customer'}</h4>
                        ${isNewDelivery ? '<span class="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">NEW</span>' : ''}
                    </div>
                    <span class="text-xs text-gray-500">${time}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-1 text-gray-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <span>${totalQty} cylinders</span>
                    </div>
                    <span class="font-semibold text-green-600">₹${totalPayment.toLocaleString('en-IN')}</span>
                </div>
            </div>
        `;
    });
    
    $('#deliveriesList').html(html);
    
    // Show end trip button if there are deliveries
    $('#endTripSection').removeClass('hidden');
}

function viewDeliveryDetail(deliveryId) {
    // Navigate to delivery detail page (you can implement this later)
    showToast('Delivery detail view - coming soon', 'info');
}

async function refreshDeliveries() {  // ← Made async
    if (!currentTrip) return;
    
    // Add spinning animation to refresh button
    const btn = event.target.closest('button');
    const icon = btn.querySelector('svg');
    icon.classList.add('animate-spin');
    
    console.log('Manual refresh: Reloading deliveries...');
    await loadTripDeliveries(currentTrip);  // ← Added await
    await loadCurrentLoad(currentTrip);  // ← Added await
    
    setTimeout(() => {
        icon.classList.remove('animate-spin');
        showToast('Deliveries refreshed', 'success');
    }, 500);
}

async function refreshTripData() {  // ← Made async
    // Add spinning animation to header refresh button
    const btn = $('#refreshBtn svg');
    btn.addClass('animate-spin');
    
    console.log('Full refresh: Reloading entire trip data...');
    await loadActiveTrip();  // ← Added await
    
    setTimeout(() => {
        btn.removeClass('animate-spin');
        showToast('Trip data refreshed', 'success');
    }, 500);
}

async function callManager() {  // ← Made async
    const user = getCurrentUser();
    // UPDATED: Made data fetching async
    const godowns = await getGodowns();  // ← Added await
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

async function submitEndTrip() {  // ← Made async
    const endKm = parseInt($('#endKm').val());
    const notes = $('#tripNotes').val();
    
    if (!endKm || endKm < currentTrip.start_km) {
        showToast('Please enter valid ending KM (must be greater than or equal to start KM)', 'error');
        return;
    }
    
    // Check if any deliveries were made
    // UPDATED: Made data fetching async
    const deliveries = (await getDeliveries()).filter(d => d.trip_id === currentTrip.id);  // ← Added await
    if (deliveries.length === 0) {
        showToast('Cannot end trip without any deliveries', 'warning');
        return;
    }
    
    // Update trip status to pending_closure (waiting for manager approval)
    const trips = await getTrips();  // ← Added await
    const tripIndex = trips.findIndex(t => t.id === currentTrip.id);
    
    if (tripIndex !== -1) {
        trips[tripIndex].end_km = endKm;
        trips[tripIndex].end_time = new Date().toISOString();
        trips[tripIndex].driver_notes = notes;
        trips[tripIndex].status = 'pending_closure'; // Trip awaiting manager approval
        
        await saveTrips(trips);  // ← Added await
        
        showToast('Trip submitted to manager for approval', 'success');
        
        setTimeout(() => {
            window.location.href = 'driver-dashboard.html';
        }, 1500);
    }
}