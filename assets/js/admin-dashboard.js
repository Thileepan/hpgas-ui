// Admin Dashboard JavaScript

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

    loadDashboardData();
});

function loadDashboardData() {
    const godowns = getGodowns();
    const customers = getCustomers();
    const trips = getTrips();
    const deliveries = getDeliveries();

    // Update stats
    $('#totalGodowns').text(godowns.length);
    $('#totalCustomers').text(customers.length);
    
    const activeTrips = trips.filter(t => t.status === 'ongoing');
    $('#activeTrips').text(activeTrips.length);

    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = deliveries.filter(d => d.delivery_date === today);
    $('#todayDeliveries').text(todayDeliveries.length);

    // Load godown overview
    loadGodownOverview(godowns);

    // Load recent activity
    loadRecentActivity(trips, deliveries);
}

function loadGodownOverview(godowns) {
    const inventory = getInventory();
    const trips = getTrips();
    
    let html = '';
    godowns.forEach((godown, index) => {
        const godownInventory = inventory.filter(i => i.godown_id === godown.id);
        const totalFilled = godownInventory.reduce((sum, item) => sum + item.filled, 0);
        const totalEmpty = godownInventory.reduce((sum, item) => sum + item.empty, 0);
        const inTransit = godownInventory.reduce((sum, item) => sum + item.in_transit, 0);
        
        const godownTrips = trips.filter(t => t.godown_id === godown.id && t.status === 'ongoing');
        
        html += `
            <div class="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" 
                 onclick="window.location.href='admin-godowns.html?id=${godown.id}'"
                 style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${godown.name}</h3>
                            <p class="text-sm text-gray-500">${godown.city}</p>
                        </div>
                    </div>
                    ${godownTrips.length > 0 ? `
                        <span class="badge badge-success">
                            <span class="status-dot active"></span>
                            ${godownTrips.length} Active
                        </span>
                    ` : `
                        <span class="badge badge-secondary">Idle</span>
                    `}
                </div>
                <div class="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Filled</p>
                        <p class="text-lg font-bold text-green-600">${totalFilled}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">Empty</p>
                        <p class="text-lg font-bold text-gray-600">${totalEmpty}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 mb-1">In Transit</p>
                        <p class="text-lg font-bold text-orange-600">${inTransit}</p>
                    </div>
                </div>
            </div>
        `;
    });

    if (html === '') {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <p class="text-gray-500 font-medium">No godowns found</p>
                <button class="btn btn-primary btn-sm mt-4" onclick="window.location.href='admin-godowns.html'">
                    Add Godown
                </button>
            </div>
        `;
    }

    $('#godownList').html(html);
}

function loadRecentActivity(trips, deliveries) {
    const users = getUsers();
    const vehicles = getVehicles();
    const customers = getCustomers();
    
    let activities = [];

    // Add trip activities
    trips.slice(-5).reverse().forEach(trip => {
        const driver = users.find(u => u.id === trip.driver_id);
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
        
        activities.push({
            type: trip.trip_type === 'delivery' ? 'trip' : 'refill',
            title: trip.trip_type === 'delivery' ? 'Delivery Trip Created' : 'Refill Trip Created',
            description: `${driver?.name} - ${vehicle?.vehicle_number}`,
            dc_number: trip.dc_number,
            time: formatTime(trip.created_at),
            status: trip.status,
            created_at: trip.created_at
        });
    });

    // Add delivery activities
    deliveries.slice(-5).reverse().forEach(delivery => {
        const customer = customers.find(c => c.id === delivery.customer_id);
        const totalAmount = delivery.payments.reduce((sum, p) => sum + p.amount, 0);
        
        activities.push({
            type: 'delivery',
            title: 'Delivery Completed',
            description: customer?.name || 'Unknown Customer',
            amount: `₹${totalAmount.toLocaleString()}`,
            time: formatTime(delivery.created_at),
            status: 'completed',
            created_at: delivery.created_at
        });
    });

    // Sort by time
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    activities = activities.slice(0, 5);

    let html = '';
    activities.forEach((activity, index) => {
        const icon = activity.type === 'delivery' 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
            : activity.type === 'trip'
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>';
        
        const bgColor = activity.type === 'delivery' ? 'bg-green-100' : activity.type === 'trip' ? 'bg-orange-100' : 'bg-blue-100';
        const iconColor = activity.type === 'delivery' ? 'text-green-600' : activity.type === 'trip' ? 'text-orange-600' : 'text-blue-600';

        html += `
            <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                 style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                <div class="w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${icon}
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                        <div>
                            <p class="font-medium text-gray-900 text-sm">${activity.title}</p>
                            <p class="text-sm text-gray-600">${activity.description}</p>
                            ${activity.dc_number ? `<p class="text-xs text-gray-500 mt-1">${activity.dc_number}</p>` : ''}
                        </div>
                        ${activity.amount ? `<span class="text-sm font-semibold text-green-600">${activity.amount}</span>` : ''}
                    </div>
                    <p class="text-xs text-gray-500 mt-1">${activity.time}</p>
                </div>
            </div>
        `;
    });

    if (html === '') {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No recent activity</p>
            </div>
        `;
    }

    $('#recentActivity').html(html);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
}