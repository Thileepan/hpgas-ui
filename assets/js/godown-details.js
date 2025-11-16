// Godown Details JavaScript

let currentGodownId = null;
let currentTab = 'inventory';

$(document).ready(function() {
    const user = checkAuth();
    if (!user || user.role !== 'super_admin') {
        logout();
        return;
    }

    // Update user info
    $('#userName').text(user.name);
    const initials = user.name.split(' ').map(n => n[0]).join('');
    $('#userInitials').text(initials);

    // Get godown ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentGodownId = urlParams.get('id');

    if (!currentGodownId) {
        window.location.href = 'admin-godowns.html';
        return;
    }

    // Convert to number for comparison
    currentGodownId = parseInt(currentGodownId);

    loadGodownDetails();
});

function loadGodownDetails() {
    const godowns = getGodowns();
    const godown = godowns.find(g => g.id === currentGodownId);

    if (!godown) {
        showToast('Godown not found', 'error');
        setTimeout(() => {
            window.location.href = 'admin-godowns.html';
        }, 1500);
        return;
    }

    // Update header
    $('#godownNameHeader').text(godown.name);
    $('#godownCityHeader').text(godown.city);
    $('#godownName').text(godown.name);
    $('#godownCity').text(`${godown.city}, ${godown.state}`);

    // Load godown details
    loadGodownInfo(godown);
    
    // Load stats
    loadStats();

    // Load current tab
    loadTabContent(currentTab);
}

function loadGodownInfo(godown) {
    const trips = getTrips().filter(t => t.godown_id === currentGodownId && t.status === 'ongoing');
    
    let statusHtml = '';
    if (trips.length > 0) {
        statusHtml = `
            <span class="badge badge-success">
                <span class="status-dot active"></span>
                ${trips.length} Active Trip${trips.length > 1 ? 's' : ''}
            </span>
        `;
    } else {
        statusHtml = '<span class="badge badge-secondary">Idle</span>';
    }
    $('#activeStatus').html(statusHtml);

    let detailsHtml = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="detail-item">
                <span class="detail-label">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Address
                </span>
                <span class="detail-value">${godown.address}</span>
            </div>

            <div class="detail-item">
                <span class="detail-label">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Pincode
                </span>
                <span class="detail-value">${godown.pincode}</span>
            </div>

            <div class="detail-item">
                <span class="detail-label">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    Contact
                </span>
                <span class="detail-value">${godown.phone}</span>
            </div>

            ${godown.email ? `
                <div class="detail-item">
                    <span class="detail-label">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                        </svg>
                        Email
                    </span>
                    <span class="detail-value">${godown.email}</span>
                </div>
            ` : ''}

            ${godown.latitude && godown.longitude ? `
                <div class="detail-item md:col-span-2">
                    <span class="detail-label">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                        </svg>
                        GPS Coordinates
                    </span>
                    <span class="detail-value">${godown.latitude}, ${godown.longitude}</span>
                </div>
            ` : ''}
        </div>
    `;

    $('#godownDetails').html(detailsHtml);
}

function loadStats() {
    const vehicles = getVehicles().filter(v => v.godown_id === currentGodownId);
    const users = getUsers().filter(u => u.godown_id === currentGodownId && (u.role === 'manager' || u.role === 'driver' || u.role === 'loadman'));
    const trips = getTrips().filter(t => t.godown_id === currentGodownId && t.status === 'ongoing');
    const inventory = getInventory().filter(i => i.godown_id === currentGodownId);
    const totalFilled = inventory.reduce((sum, item) => sum + item.filled, 0);

    $('#totalVehicles').text(vehicles.length);
    $('#totalStaff').text(users.length);
    $('#activeTrips').text(trips.length);
    $('#filledStock').text(totalFilled);
}

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    $('.tab-btn').removeClass('active');
    $(`.tab-btn[data-tab="${tab}"]`).addClass('active');
    
    // Update tab content
    $('.tab-content').addClass('hidden');
    $(`#${tab}Tab`).removeClass('hidden');
    
    // Load content
    loadTabContent(tab);
}

function loadTabContent(tab) {
    switch(tab) {
        case 'inventory':
            loadInventory();
            break;
        case 'team':
            loadTeam();
            break;
        case 'trips':
            loadTrips();
            break;
        case 'deliveries':
            loadDeliveries();
            break;
    }
}

function loadInventory() {
    const inventory = getInventory().filter(i => i.godown_id === currentGodownId);
    
    if (inventory.length === 0) {
        $('#inventoryList').html(`
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                <p class="text-gray-500 font-medium">No inventory data</p>
            </div>
        `);
        return;
    }

    // Group by provider
    const providers = {};
    inventory.forEach(item => {
        if (!providers[item.provider]) {
            providers[item.provider] = [];
        }
        providers[item.provider].push(item);
    });

    let html = '';
    Object.keys(providers).forEach((provider, providerIndex) => {
        const items = providers[provider];
        const totalFilled = items.reduce((sum, item) => sum + item.filled, 0);
        const totalEmpty = items.reduce((sum, item) => sum + item.empty, 0);
        const totalInTransit = items.reduce((sum, item) => sum + item.in_transit, 0);
        const totalDamaged = items.reduce((sum, item) => sum + item.damaged, 0);
        const total = totalFilled + totalEmpty + totalInTransit;
        const filledPercentage = total > 0 ? Math.round((totalFilled / total) * 100) : 0;

        html += `
            <div class="card animate-slide-up" style="animation-delay: ${providerIndex * 0.1}s">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-900">${provider}</h3>
                    <span class="text-sm font-medium text-orange-600">${filledPercentage}% Filled</span>
                </div>

                <div class="grid grid-cols-4 gap-3 mb-4">
                    <div class="p-3 bg-green-50 rounded-lg text-center">
                        <p class="text-xs text-green-600 font-medium mb-1">Filled</p>
                        <p class="text-2xl font-bold text-green-600">${totalFilled}</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg text-center">
                        <p class="text-xs text-gray-600 font-medium mb-1">Empty</p>
                        <p class="text-2xl font-bold text-gray-600">${totalEmpty}</p>
                    </div>
                    <div class="p-3 bg-orange-50 rounded-lg text-center">
                        <p class="text-xs text-orange-600 font-medium mb-1">Transit</p>
                        <p class="text-2xl font-bold text-orange-600">${totalInTransit}</p>
                    </div>
                    <div class="p-3 bg-red-50 rounded-lg text-center">
                        <p class="text-xs text-red-600 font-medium mb-1">Damaged</p>
                        <p class="text-2xl font-bold text-red-600">${totalDamaged}</p>
                    </div>
                </div>

                <div class="space-y-2">
        `;

        items.forEach(item => {
            const cylinderType = `${item.kg}kg Commercial`;
            html += `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span class="text-sm font-medium text-gray-900">${cylinderType}</span>
                    <div class="flex items-center gap-4 text-sm">
                        <span class="text-green-600 font-medium">${item.filled} F</span>
                        <span class="text-gray-600">${item.empty} E</span>
                        <span class="text-orange-600">${item.in_transit} T</span>
                        ${item.damaged > 0 ? `<span class="text-red-600">${item.damaged} D</span>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="mt-4 w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all" 
                         style="width: ${filledPercentage}%"></div>
                </div>
            </div>
        `;
    });

    $('#inventoryList').html(html);
}

function loadTeam() {
    const users = getUsers().filter(u => u.godown_id === currentGodownId);
    const manager = users.find(u => u.role === 'manager');
    const drivers = users.filter(u => u.role === 'driver');
    const loadmen = users.filter(u => u.role === 'loadman');

    // Load Manager
    if (manager) {
        $('#managerInfo').html(`
            <div class="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div class="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-xl">${manager.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-gray-900">${manager.name}</h4>
                    <p class="text-sm text-gray-600">${manager.email}</p>
                    <p class="text-sm text-gray-600 mt-1">${manager.phone}</p>
                </div>
                <span class="badge badge-primary">Manager</span>
            </div>
        `);
    } else {
        $('#managerInfo').html(`
            <div class="empty-state py-8">
                <p class="text-gray-500">No manager assigned</p>
            </div>
        `);
    }

    // Load Drivers
    $('#driverCount').text(drivers.length);
    if (drivers.length > 0) {
        let driversHtml = '';
        drivers.forEach((driver, index) => {
            driversHtml += `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-semibold">${driver.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${driver.name}</h4>
                        <p class="text-sm text-gray-600">${driver.phone}</p>
                    </div>
                    <span class="badge badge-secondary">Driver</span>
                </div>
            `;
        });
        $('#driversList').html(driversHtml);
    } else {
        $('#driversList').html(`
            <div class="empty-state py-8">
                <p class="text-gray-500">No drivers found</p>
            </div>
        `);
    }

    // Load Loadmen
    $('#loadmenCount').text(loadmen.length);
    if (loadmen.length > 0) {
        let loadmenHtml = '';
        loadmen.forEach((loadman, index) => {
            loadmenHtml += `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span class="text-green-600 font-semibold">${loadman.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${loadman.name}</h4>
                        <p class="text-sm text-gray-600">${loadman.phone}</p>
                    </div>
                    <span class="badge badge-secondary">Loadman</span>
                </div>
            `;
        });
        $('#loadmenList').html(loadmenHtml);
    } else {
        $('#loadmenList').html(`
            <div class="empty-state py-8">
                <p class="text-gray-500">No loadmen found</p>
            </div>
        `);
    }
}

function loadTrips() {
    const trips = getTrips().filter(t => t.godown_id === currentGodownId);
    
    if (trips.length === 0) {
        $('#tripsList').html(`
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No trips found</p>
            </div>
        `);
        return;
    }

    const vehicles = getVehicles();
    const users = getUsers();

    // Sort by date - most recent first
    trips.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    let html = '';
    trips.slice(0, 20).forEach((trip, index) => {
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        const driver = users.find(u => u.id === trip.driver_id);
        const startDate = new Date(trip.start_time);
        
        const statusClass = trip.status === 'ongoing' ? 'badge-success' : 'badge-secondary';
        const statusText = trip.status === 'ongoing' ? 'Ongoing' : 'Completed';
        const statusDot = trip.status === 'ongoing' ? '<span class="status-dot active"></span>' : '';

        html += `
            <div class="card hover:shadow-lg transition-all cursor-pointer animate-slide-up" 
                 style="animation-delay: ${index * 0.05}s"
                 onclick="window.location.href='trip-details.html?id=${trip.id}'">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h3 class="font-semibold text-gray-900">${trip.dc_number}</h3>
                        <p class="text-sm text-gray-600">${trip.trip_type === 'delivery' ? 'Delivery Trip' : 'Refill Trip'}</p>
                    </div>
                    <span class="badge ${statusClass}">
                        ${statusDot}
                        ${statusText}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-gray-500">Vehicle</p>
                        <p class="font-medium text-gray-900">${vehicle?.vehicle_number || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Driver</p>
                        <p class="font-medium text-gray-900">${driver?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Start Date</p>
                        <p class="font-medium text-gray-900">${startDate.toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Start KM</p>
                        <p class="font-medium text-gray-900">${trip.start_km}</p>
                    </div>
                </div>
            </div>
        `;
    });

    $('#tripsList').html(html);
}

function loadDeliveries() {
    const trips = getTrips().filter(t => t.godown_id === currentGodownId);
    const tripIds = trips.map(t => t.id);
    const deliveries = getDeliveries().filter(d => tripIds.includes(d.trip_id));
    
    if (deliveries.length === 0) {
        $('#deliveriesList').html(`
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No deliveries found</p>
            </div>
        `);
        return;
    }

    const customers = getCustomers();

    // Sort by date - most recent first
    deliveries.sort((a, b) => new Date(b.delivery_date) - new Date(a.delivery_date));

    let html = '';
    deliveries.slice(0, 20).forEach((delivery, index) => {
        const customer = customers.find(c => c.id === delivery.customer_id);
        const trip = trips.find(t => t.id === delivery.trip_id);
        const totalAmount = delivery.payments.reduce((sum, p) => sum + p.amount, 0);
        const deliveryDate = new Date(delivery.delivery_date);

        html += `
            <div class="card animate-slide-up" style="animation-delay: ${index * 0.05}s">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h3 class="font-semibold text-gray-900">${customer?.name || 'Unknown Customer'}</h3>
                        <p class="text-sm text-gray-600">${trip?.dc_number || 'N/A'}</p>
                    </div>
                    <span class="text-lg font-bold text-green-600">₹${totalAmount.toLocaleString()}</span>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                        <p class="text-gray-500">Date</p>
                        <p class="font-medium text-gray-900">${deliveryDate.toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Time</p>
                        <p class="font-medium text-gray-900">${deliveryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <div class="pt-3 border-t border-gray-200">
                    <p class="text-xs text-gray-500 mb-2">Cylinders Delivered</p>
                    <div class="flex flex-wrap gap-2">
                        ${delivery.cylinders.map(c => `
                            <span class="badge badge-secondary">${c.quantity}x ${c.type}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });

    $('#deliveriesList').html(html);
}

function openEditGodownModal() {
    window.location.href = `admin-godowns.html?edit=${currentGodownId}`;
}