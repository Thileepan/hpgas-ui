// Godown Details JavaScript
// UPDATED: Now using Supabase instead of localStorage

let currentGodownId = null;
let currentTab = 'inventory';

$(document).ready(async function() {  // ← Made async
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

    await loadGodownDetails();
});

async function loadGodownDetails() {  // ← Made async
    const godowns = await getGodowns();  // ← Added await
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
    await loadGodownInfo(godown);
    
    // Load stats
    await loadStats();

    // Load current tab
    await loadTabContent(currentTab);
}

async function loadGodownInfo(godown) {  // ← Made async
    const trips = (await getTrips()).filter(t => t.godown_id === currentGodownId && t.status === 'ongoing');  // ← Added await
    
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

async function loadStats() {  // ← Made async
    // UPDATED: Made all data fetching async
    const vehicles = (await getVehicles()).filter(v => v.godown_id === currentGodownId);
    const users = (await getUsers()).filter(u => u.godown_id === currentGodownId && (u.role === 'manager' || u.role === 'driver' || u.role === 'loadman'));
    const trips = (await getTrips()).filter(t => t.godown_id === currentGodownId && t.status === 'ongoing');
    const inventory = (await getInventory()).filter(i => i.godown_id === currentGodownId);
    const totalFilled = inventory.reduce((sum, item) => sum + item.filled, 0);

    $('#totalVehicles').text(vehicles.length);
    $('#totalStaff').text(users.length);
    $('#activeTrips').text(trips.length);
    $('#filledStock').text(totalFilled);
}

async function switchTab(tab) {  // ← Made async
    currentTab = tab;
    
    // Update tab buttons
    $('.tab-btn').removeClass('active');
    $(`.tab-btn[data-tab="${tab}"]`).addClass('active');
    
    // Update tab content
    $('.tab-content').addClass('hidden');
    $(`#${tab}Tab`).removeClass('hidden');
    
    // Load content
    await loadTabContent(tab);  // ← Added await
}

async function loadTabContent(tab) {  // ← Made async
    switch(tab) {
        case 'inventory':
            await loadInventory();
            break;
        case 'team':
            await loadTeam();
            break;
        case 'trips':
            await loadTrips();
            break;
        case 'deliveries':
            await loadDeliveries();
            break;
    }
}

async function loadInventory() {  // ← Made async
    const inventory = (await getInventory()).filter(i => i.godown_id === currentGodownId);  // ← Added await
    
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

        html += `
            <div class="card mb-4 animate-slide-up" style="animation-delay: ${providerIndex * 0.1}s">
                <h3 class="font-bold text-lg mb-4">${provider}</h3>
                <div class="grid grid-cols-4 gap-3 mb-4">
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                        <p class="text-2xl font-bold text-green-600">${totalFilled}</p>
                        <p class="text-xs text-gray-600">Filled</p>
                    </div>
                    <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <p class="text-2xl font-bold text-gray-600">${totalEmpty}</p>
                        <p class="text-xs text-gray-600">Empty</p>
                    </div>
                    <div class="text-center p-3 bg-orange-50 rounded-lg">
                        <p class="text-2xl font-bold text-orange-600">${totalInTransit}</p>
                        <p class="text-xs text-gray-600">In Transit</p>
                    </div>
                    <div class="text-center p-3 bg-red-50 rounded-lg">
                        <p class="text-2xl font-bold text-red-600">${totalDamaged}</p>
                        <p class="text-xs text-gray-600">Damaged</p>
                    </div>
                </div>
                <div class="space-y-2">
                    ${items.sort((a, b) => parseFloat(a.kg) - parseFloat(b.kg)).map(item => `
                        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span class="font-medium">${item.kg} kg</span>
                            <div class="flex gap-4 text-sm">
                                <span class="text-green-600">F: ${item.filled}</span>
                                <span class="text-gray-600">E: ${item.empty}</span>
                                <span class="text-orange-600">T: ${item.in_transit}</span>
                                <span class="text-red-600">D: ${item.damaged}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    $('#inventoryList').html(html);
}

async function loadTeam() {  // ← Made async
    const users = (await getUsers()).filter(u => u.godown_id === currentGodownId);  // ← Added await
    const managers = users.filter(u => u.role === 'manager');
    const drivers = users.filter(u => u.role === 'driver');
    const loadmen = users.filter(u => u.role === 'loadman');

    // Load Managers Section
    $('#managerCount').text(managers.length);
    
    if (managers.length > 0) {
        let managersHtml = '';
        managers.forEach((manager, index) => {
            const statusBadge = manager.status === 'inactive' 
                ? '<span class="badge badge-secondary ml-2">Deactivated</span>'
                : '';
            
            managersHtml += `
                <div class="flex items-center gap-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200 mb-3" style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                    <div class="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-white font-bold text-xl">${manager.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-gray-900">${manager.name}</h4>
                            ${statusBadge}
                        </div>
                        <p class="text-sm text-gray-600">${manager.email}</p>
                        <p class="text-sm text-gray-600 mt-1">${manager.phone}</p>
                    </div>
                    <div class="flex flex-col gap-2">
                        <button onclick="editManager(${manager.id})" class="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                        </button>
                        ${manager.status !== 'inactive' ? `
                            <button onclick="deactivateManager(${manager.id})" class="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-300 rounded-lg text-sm font-medium text-red-700 transition-colors">
                                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                                </svg>
                                Deactivate
                            </button>
                        ` : `
                            <button onclick="activateManager(${manager.id})" class="px-4 py-2 bg-green-50 hover:bg-green-100 border border-green-300 rounded-lg text-sm font-medium text-green-700 transition-colors">
                                <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Activate
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
        
        // Add button to add more managers
        managersHtml += `
            <button onclick="openAddManagerModal()" class="w-full p-4 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-colors">
                <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span class="font-medium">Add Another Manager</span>
            </button>
        `;
        
        $('#managerInfo').html(managersHtml);
    } else {
        $('#managerInfo').html(`
            <div class="empty-state py-8">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No managers assigned</p>
                <button onclick="openAddManagerModal()" class="btn btn-primary btn-sm mt-4">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add Manager
                </button>
            </div>
        `);
    }

    // Load Drivers
    $('#driverCount').text(drivers.length);
    if (drivers.length > 0) {
        let driversHtml = '';
        drivers.forEach((driver, index) => {
            const statusBadge = driver.status === 'inactive' 
                ? '<span class="badge badge-secondary ml-2">Inactive</span>'
                : '';
            driversHtml += `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 font-semibold">${driver.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-semibold text-gray-900">${driver.name}</h4>
                            ${statusBadge}
                        </div>
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
            const statusBadge = loadman.status === 'inactive' 
                ? '<span class="badge badge-secondary ml-2">Inactive</span>'
                : '';
            loadmenHtml += `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg" style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span class="text-green-600 font-semibold">${loadman.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <h4 class="font-semibold text-gray-900">${loadman.name}</h4>
                            ${statusBadge}
                        </div>
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

async function loadTrips() {  // ← Made async
    const trips = (await getTrips()).filter(t => t.godown_id === currentGodownId);  // ← Added await
    
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

    // UPDATED: Made data fetching async
    const vehicles = await getVehicles();
    const users = await getUsers();

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
            <div class="card animate-slide-up" style="animation-delay: ${index * 0.05}s">
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

async function loadDeliveries() {  // ← Made async
    const trips = (await getTrips()).filter(t => t.godown_id === currentGodownId);  // ← Added await
    const tripIds = trips.map(t => t.id);
    const deliveries = (await getDeliveries()).filter(d => tripIds.includes(d.trip_id));  // ← Added await
    
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

    const customers = await getCustomers();  // ← Added await

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
                        ${delivery.delivered_items.map(c => `
                            <span class="badge badge-secondary">${c.quantity}x ${c.provider} ${c.kg}kg</span>
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

// ==================== MANAGER MANAGEMENT ====================

function openAddManagerModal() {
    $('#managerModalTitle').text('Add Manager');
    $('#managerSubmitBtn').text('Add Manager');
    $('#managerForm')[0].reset();
    $('#managerId').val('');
    $('#managerPasswordGroup').show();
    $('#managerPassword').prop('required', true);
    $('#managerModal').removeClass('hidden');
}

async function editManager(managerId) {  // ← Made async
    const users = await getUsers();  // ← Added await
    const manager = users.find(u => u.id === managerId);
    
    if (!manager) return;
    
    $('#managerModalTitle').text('Edit Manager');
    $('#managerSubmitBtn').text('Update Manager');
    $('#managerId').val(manager.id);
    $('#managerName').val(manager.name);
    $('#managerEmail').val(manager.email);
    $('#managerPhone').val(manager.phone);
    $('#managerPasswordGroup').hide();
    $('#managerPassword').prop('required', false);
    $('#managerModal').removeClass('hidden');
}

function closeManagerModal() {
    $('#managerModal').addClass('hidden');
    $('#managerForm')[0].reset();
}

async function saveManager(event) {  // ← Made async
    event.preventDefault();
    
    const users = await getUsers();  // ← Added await
    const managerId = $('#managerId').val();
    const managerData = {
        name: $('#managerName').val().trim(),
        email: $('#managerEmail').val().trim().toLowerCase(),
        phone: $('#managerPhone').val().trim(),
        role: 'manager',
        godown_id: currentGodownId,
        status: 'active'
    };
    
    // Check if email already exists (for different user)
    const existingUser = users.find(u => u.email === managerData.email && u.id != managerId);
    if (existingUser) {
        showToast('Email already exists!', 'error');
        return;
    }
    
    if (managerId) {
        // Update existing manager
        const index = users.findIndex(u => u.id == managerId);
        if (index !== -1) {
            users[index] = {
                ...users[index],
                ...managerData
            };
            showToast('Manager updated successfully!', 'success');
        }
    } else {
        // Add new manager
        const password = $('#managerPassword').val().trim();
        if (!password) {
            showToast('Password is required!', 'error');
            return;
        }
        
        const newManager = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            ...managerData,
            password: password
        };
        users.push(newManager);
        showToast('Manager added successfully!', 'success');
    }
    
    // UPDATED: Use Supabase instead of localStorage
    await saveUsers(users);
    closeManagerModal();
    await loadTeam();
}

async function deactivateManager(managerId) {  // ← Made async
    if (!confirm('Are you sure you want to deactivate this manager? They will not be able to login.')) {
        return;
    }
    
    const users = await getUsers();  // ← Added await
    const manager = users.find(u => u.id === managerId);
    
    if (manager) {
        manager.status = 'inactive';
        
        // UPDATED: Use Supabase instead of localStorage
        await saveUsers(users);
        showToast('Manager deactivated successfully!', 'success');
        await loadTeam();
    }
}

async function activateManager(managerId) {  // ← Made async
    const users = await getUsers();  // ← Added await
    const manager = users.find(u => u.id === managerId);
    
    if (manager) {
        manager.status = 'active';
        
        // UPDATED: Use Supabase instead of localStorage
        await saveUsers(users);
        showToast('Manager activated successfully!', 'success');
        await loadTeam();
    }
}