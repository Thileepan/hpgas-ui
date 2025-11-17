// Admin Godowns JavaScript
// UPDATED: Now using Supabase instead of localStorage

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

    await loadGodownsData();

    // Form submission - UPDATED: Made async
    $('#godownForm').on('submit', async function(e) {  // ← Made async
        e.preventDefault();
        await saveGodown();  // ← Added await
    });
});

async function loadGodownsData() {  // ← Made async
    // UPDATED: Made all data fetching async
    const godowns = await getGodowns();
    const vehicles = await getVehicles();
    const users = await getUsers();
    const trips = await getTrips();

    // Update summary stats
    $('#totalGodowns').text(godowns.length);
    $('#totalVehicles').text(vehicles.length);
    
    const staff = users.filter(u => u.role === 'manager' || u.role === 'driver' || u.role === 'loadman');
    $('#totalStaff').text(staff.length);
    
    const activeTrips = trips.filter(t => t.status === 'ongoing');
    $('#activeTrips').text(activeTrips.length);

    // Load godowns list
    await loadGodownsList(godowns);
}

async function loadGodownsList(godowns) {  // ← Made async
    if (godowns.length === 0) {
        $('#godownsList').addClass('hidden');
        $('#emptyState').removeClass('hidden');
        return;
    }

    $('#godownsList').removeClass('hidden');
    $('#emptyState').addClass('hidden');

    // UPDATED: Made all data fetching async
    const inventory = await getInventory();
    const vehicles = await getVehicles();
    const users = await getUsers();
    const trips = await getTrips();

    let html = '';
    godowns.forEach((godown, index) => {
        // Calculate stats for this godown
        const godownInventory = inventory.filter(i => i.godown_id === godown.id);
        const totalFilled = godownInventory.reduce((sum, item) => sum + item.filled, 0);
        const totalEmpty = godownInventory.reduce((sum, item) => sum + item.empty, 0);
        const inTransit = godownInventory.reduce((sum, item) => sum + item.in_transit, 0);
        
        const godownVehicles = vehicles.filter(v => v.godown_id === godown.id);
        const godownStaff = users.filter(u => u.godown_id === godown.id && (u.role === 'manager' || u.role === 'driver' || u.role === 'loadman'));
        const godownTrips = trips.filter(t => t.godown_id === godown.id && t.status === 'ongoing');
        
        const manager = users.find(u => u.godown_id === godown.id && u.role === 'manager');

        html += `
            <div class="card hover:shadow-lg transition-all cursor-pointer animate-slide-up" 
                 style="animation-delay: ${index * 0.1}s"
                 onclick="window.location.href='godown-details.html?id=${godown.id}'">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">${godown.name}</h3>
                            <p class="text-sm text-gray-600">${godown.city}, ${godown.state}</p>
                            ${manager ? `<p class="text-xs text-gray-500 mt-1">Manager: ${manager.name}</p>` : ''}
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

                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div class="p-3 bg-green-50 rounded-lg">
                        <p class="text-xs text-green-600 font-medium mb-1">Filled Stock</p>
                        <p class="text-2xl font-bold text-green-600">${totalFilled}</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-600 font-medium mb-1">Empty Stock</p>
                        <p class="text-2xl font-bold text-gray-600">${totalEmpty}</p>
                    </div>
                    <div class="p-3 bg-orange-50 rounded-lg">
                        <p class="text-xs text-orange-600 font-medium mb-1">In Transit</p>
                        <p class="text-2xl font-bold text-orange-600">${inTransit}</p>
                    </div>
                    <div class="p-3 bg-blue-50 rounded-lg">
                        <p class="text-xs text-blue-600 font-medium mb-1">Vehicles</p>
                        <p class="text-2xl font-bold text-blue-600">${godownVehicles.length}</p>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div class="flex items-center gap-4 text-sm text-gray-600">
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            ${godownStaff.length} Staff
                        </span>
                        <span class="flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            ${godown.phone}
                        </span>
                    </div>
                    <button onclick="event.stopPropagation(); handleEditGodown(${godown.id})" 
                            class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    $('#godownsList').html(html);
}

function openAddGodownModal() {
    $('#godownId').val('');
    $('#modalTitle').text('Add New Godown');
    $('#submitBtnText').text('Add Godown');
    $('#godownForm')[0].reset();
    $('#godownModal').removeClass('hidden');
}

async function openEditGodownModal(godownId) {  // ← Made async
    const godowns = await getGodowns();  // ← Added await
    const godown = godowns.find(g => g.id === godownId);
    
    if (!godown) return;

    $('#godownId').val(godown.id);
    $('#modalTitle').text('Edit Godown');
    $('#submitBtnText').text('Update Godown');
    
    $('#godownName').val(godown.name);
    $('#godownCity').val(godown.city);
    $('#godownState').val(godown.state);
    $('#godownAddress').val(godown.address);
    $('#godownPincode').val(godown.pincode);
    $('#godownPhone').val(godown.phone);
    $('#godownLatitude').val(godown.latitude || '');
    $('#godownLongitude').val(godown.longitude || '');
    $('#godownEmail').val(godown.email || '');
    
    $('#godownModal').removeClass('hidden');
}

function closeGodownModal() {
    $('#godownModal').addClass('hidden');
    $('#godownForm')[0].reset();
}

// Wrapper function to handle async edit operation
function handleEditGodown(godownId) {
    openEditGodownModal(godownId);
}

async function saveGodown() {
    const godownId = $('#godownId').val();
    
    const godownData = {
        name: $('#godownName').val().trim(),
        city: $('#godownCity').val().trim(),
        state: $('#godownState').val().trim(),
        address: $('#godownAddress').val().trim(),
        pincode: $('#godownPincode').val().trim(),
        phone: $('#godownPhone').val().trim(),
        latitude: $('#godownLatitude').val().trim() || null,
        longitude: $('#godownLongitude').val().trim() || null,
        email: $('#godownEmail').val().trim() || null
    };

    try {
        if (godownId) {
            // Update existing godown - Convert string ID to number for comparison
            const numericId = parseInt(godownId);
            const godowns = await getGodowns();
            const index = godowns.findIndex(g => g.id === numericId);
            
            if (index !== -1) {
                godowns[index] = {
                    ...godowns[index],
                    ...godownData,
                    updated_at: new Date().toISOString()
                };
                await saveGodowns(godowns);
                showToast('Godown updated successfully!', 'success');
            }
        } else {
            // Add new godown
            const godowns = await getGodowns();
            const newGodown = {
                id: godowns.length > 0 ? Math.max(...godowns.map(g => g.id)) + 1 : 1,
                ...godownData,
                created_at: new Date().toISOString()
            };
            godowns.push(newGodown);
            await saveGodowns(godowns);
            showToast('Godown added successfully!', 'success');
        }

        closeGodownModal();
        await loadGodownsData();
    } catch (error) {
        console.error('Error saving godown:', error);
        showToast('Error saving godown. Please try again.', 'error');
    }
}