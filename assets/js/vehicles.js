// Vehicles and Drivers Management JavaScript

let currentTab = 'vehicles';

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

    // Tab switching
    $('.fleet-tab').click(function() {
        const tab = $(this).data('tab');
        switchTab(tab);
    });

    // Form handlers
    $('#vehicleForm').submit(function(e) {
        e.preventDefault();
        saveVehicle();
    });

    $('#driverForm').submit(function(e) {
        e.preventDefault();
        saveDriver();
    });

    $('#loadmanForm').submit(function(e) {
        e.preventDefault();
        saveLoadman();
    });

    // Initial load
    loadVehicles();
    loadDrivers();
    loadLoadmen();
});

function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    $('.fleet-tab').removeClass('active');
    $(`.fleet-tab[data-tab="${tab}"]`).addClass('active');
    
    // Show/hide content
    $('.tab-content').addClass('hidden');
    $(`#${tab}Tab`).removeClass('hidden');
}

// ==================== VEHICLES ====================

function loadVehicles() {
    const user = getCurrentUser();
    const vehicles = getVehicles().filter(v => v.godown_id === user.godown_id);
    const drivers = getDrivers();
    const users = getUsers();
    const loadmen = getLoadmen();

    let html = '';

    if (vehicles.length === 0) {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No vehicles added</p>
                <button onclick="openAddVehicleModal()" class="btn btn-primary btn-sm mt-4">
                    Add Vehicle
                </button>
            </div>
        `;
    } else {
        vehicles.forEach((vehicle, index) => {
            const driver = users.find(u => u.id === vehicle.primary_driver_id) || 
                          drivers.find(d => d.id === vehicle.primary_driver_id);
            const loadman1 = loadmen.find(l => l.id === vehicle.primary_loadman1_id);
            const loadman2 = loadmen.find(l => l.id === vehicle.primary_loadman2_id);

            const statusColors = {
                active: 'badge-success',
                inactive: 'badge-secondary',
                maintenance: 'badge-warning'
            };

            html += `
                <div class="card card-compact animate-slide-up" style="animation-delay: ${index * 0.05}s">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900">${vehicle.vehicle_number}</h3>
                                <p class="text-sm text-gray-600">${vehicle.vehicle_type}</p>
                            </div>
                        </div>
                        <span class="badge ${statusColors[vehicle.status]} capitalize">${vehicle.status}</span>
                    </div>

                    <div class="space-y-2 mb-3">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>Driver: <strong>${driver ? driver.name : 'Not assigned'}</strong></span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <span>Loadmen: <strong>${loadman1 ? loadman1.name : 'None'}${loadman2 ? ', ' + loadman2.name : ''}</strong></span>
                        </div>
                    </div>

                    <div class="flex gap-2 pt-3 border-t border-gray-200">
                        <button onclick="editVehicle(${vehicle.id})" class="flex-1 btn btn-secondary btn-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                        </button>
                        <button onclick="deleteVehicle(${vehicle.id}, '${vehicle.vehicle_number}')" class="flex-1 btn btn-secondary btn-sm text-red-600 hover:bg-red-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
    }

    $('#vehiclesList').html(html);
}

function openAddVehicleModal() {
    $('#vehicleModalTitle').text('Add Vehicle');
    $('#vehicleForm')[0].reset();
    $('#vehicleId').val('');
    loadDriversDropdown();
    loadLoadmenDropdown();
    $('#vehicleModal').removeClass('hidden');
}

function editVehicle(id) {
    const vehicles = getVehicles();
    const vehicle = vehicles.find(v => v.id === id);
    
    if (!vehicle) return;

    $('#vehicleModalTitle').text('Edit Vehicle');
    $('#vehicleId').val(vehicle.id);
    $('#vehicleNumber').val(vehicle.vehicle_number);
    $('#vehicleType').val(vehicle.vehicle_type);
    $('#vehicleStatus').val(vehicle.status);
    
    loadDriversDropdown();
    loadLoadmenDropdown();
    
    $('#primaryDriver').val(vehicle.primary_driver_id || '');
    $('#primaryLoadman1').val(vehicle.primary_loadman1_id || '');
    $('#primaryLoadman2').val(vehicle.primary_loadman2_id || '');
    
    $('#vehicleModal').removeClass('hidden');
}

function closeVehicleModal() {
    $('#vehicleModal').addClass('hidden');
}

function saveVehicle() {
    const user = getCurrentUser();
    const vehicleId = $('#vehicleId').val();
    const vehicleNumber = $('#vehicleNumber').val().trim().toUpperCase();
    const vehicleType = $('#vehicleType').val();
    const status = $('#vehicleStatus').val();
    const primaryDriver = $('#primaryDriver').val();
    const primaryLoadman1 = $('#primaryLoadman1').val();
    const primaryLoadman2 = $('#primaryLoadman2').val();

    if (!vehicleNumber || !vehicleType) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    let vehicles = getVehicles();

    // Check duplicate vehicle number
    const duplicate = vehicles.find(v => 
        v.vehicle_number === vehicleNumber && 
        v.id != vehicleId
    );

    if (duplicate) {
        showToast('Vehicle number already exists', 'error');
        return;
    }

    if (vehicleId) {
        // Edit existing
        const index = vehicles.findIndex(v => v.id == vehicleId);
        if (index !== -1) {
            vehicles[index].vehicle_number = vehicleNumber;
            vehicles[index].vehicle_type = vehicleType;
            vehicles[index].status = status;
            vehicles[index].primary_driver_id = primaryDriver ? parseInt(primaryDriver) : null;
            vehicles[index].primary_loadman1_id = primaryLoadman1 ? parseInt(primaryLoadman1) : null;
            vehicles[index].primary_loadman2_id = primaryLoadman2 ? parseInt(primaryLoadman2) : null;
        }
        showToast('Vehicle updated successfully', 'success');
    } else {
        // Add new
        const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 1;
        vehicles.push({
            id: newId,
            vehicle_number: vehicleNumber,
            vehicle_type: vehicleType,
            godown_id: user.godown_id,
            primary_driver_id: primaryDriver ? parseInt(primaryDriver) : null,
            primary_loadman1_id: primaryLoadman1 ? parseInt(primaryLoadman1) : null,
            primary_loadman2_id: primaryLoadman2 ? parseInt(primaryLoadman2) : null,
            status: status,
            created_at: new Date().toISOString()
        });
        showToast('Vehicle added successfully', 'success');
    }

    localStorage.setItem('hpgas_vehicles', JSON.stringify(vehicles));
    loadVehicles();
    closeVehicleModal();
}

function deleteVehicle(id, vehicleNumber) {
    if (!confirm(`Are you sure you want to delete vehicle ${vehicleNumber}?`)) {
        return;
    }

    // Check if vehicle is used in any ongoing trips
    const trips = getTrips();
    const activeTrip = trips.find(t => t.vehicle_id === id && t.status === 'ongoing');
    
    if (activeTrip) {
        showToast('Cannot delete vehicle. It is assigned to an ongoing trip.', 'error');
        return;
    }

    let vehicles = getVehicles();
    vehicles = vehicles.filter(v => v.id !== id);
    localStorage.setItem('hpgas_vehicles', JSON.stringify(vehicles));
    
    showToast('Vehicle deleted successfully', 'success');
    loadVehicles();
}

// ==================== DRIVERS ====================

function loadDrivers() {
    const user = getCurrentUser();
    const drivers = getDrivers().filter(d => d.godown_id === user.godown_id);

    let html = '';

    if (drivers.length === 0) {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No drivers added</p>
                <button onclick="openAddDriverModal()" class="btn btn-primary btn-sm mt-4">
                    Add Driver
                </button>
            </div>
        `;
    } else {
        drivers.forEach((driver, index) => {
            const statusColor = driver.status === 'active' ? 'badge-success' : 'badge-secondary';

            html += `
                <div class="card card-compact animate-slide-up" style="animation-delay: ${index * 0.05}s">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900">${driver.name}</h3>
                                <p class="text-sm text-gray-600">${driver.phone}</p>
                            </div>
                        </div>
                        <span class="badge ${statusColor} capitalize">${driver.status}</span>
                    </div>

                    <div class="space-y-2 mb-3">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                            </svg>
                            <span>License: <strong>${driver.license_number}</strong></span>
                        </div>
                        ${driver.email ? `
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span>${driver.email}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="flex gap-2 pt-3 border-t border-gray-200">
                        <button onclick="editDriver(${driver.id})" class="flex-1 btn btn-secondary btn-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                        </button>
                        <button onclick="deleteDriver(${driver.id}, '${driver.name}')" class="flex-1 btn btn-secondary btn-sm text-red-600 hover:bg-red-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
    }

    $('#driversList').html(html);
}

function openAddDriverModal() {
    $('#driverModalTitle').text('Add Driver');
    $('#driverForm')[0].reset();
    $('#driverId').val('');
    $('#driverModal').removeClass('hidden');
}

function editDriver(id) {
    const drivers = getDrivers();
    const driver = drivers.find(d => d.id === id);
    
    if (!driver) return;

    $('#driverModalTitle').text('Edit Driver');
    $('#driverId').val(driver.id);
    $('#driverName').val(driver.name);
    $('#driverPhone').val(driver.phone);
    $('#driverLicense').val(driver.license_number);
    $('#driverEmail').val(driver.email || '');
    $('#driverStatus').val(driver.status);
    
    $('#driverModal').removeClass('hidden');
}

function closeDriverModal() {
    $('#driverModal').addClass('hidden');
}

function saveDriver() {
    const user = getCurrentUser();
    const driverId = $('#driverId').val();
    const name = $('#driverName').val().trim();
    const phone = $('#driverPhone').val().trim();
    const license = $('#driverLicense').val().trim().toUpperCase();
    const email = $('#driverEmail').val().trim();
    const status = $('#driverStatus').val();

    if (!name || !phone || !license) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    let drivers = getDrivers();

    if (driverId) {
        // Edit existing
        const index = drivers.findIndex(d => d.id == driverId);
        if (index !== -1) {
            drivers[index].name = name;
            drivers[index].phone = phone;
            drivers[index].license_number = license;
            drivers[index].email = email;
            drivers[index].status = status;
        }
        showToast('Driver updated successfully', 'success');
    } else {
        // Add new
        const newId = drivers.length > 0 ? Math.max(...drivers.map(d => d.id)) + 1 : 1;
        drivers.push({
            id: newId,
            name: name,
            phone: phone,
            license_number: license,
            email: email,
            godown_id: user.godown_id,
            status: status,
            created_at: new Date().toISOString()
        });
        showToast('Driver added successfully', 'success');
    }

    localStorage.setItem('hpgas_drivers', JSON.stringify(drivers));
    loadDrivers();
    loadVehicles(); // Refresh vehicles to show updated driver names
    closeDriverModal();
}

function deleteDriver(id, name) {
    if (!confirm(`Are you sure you want to delete driver ${name}?`)) {
        return;
    }

    // Check if driver is assigned to any vehicle or ongoing trip
    const vehicles = getVehicles();
    const assignedVehicle = vehicles.find(v => v.primary_driver_id === id);
    
    if (assignedVehicle) {
        showToast('Cannot delete driver. Remove from vehicle assignment first.', 'error');
        return;
    }

    const trips = getTrips();
    const activeTrip = trips.find(t => t.driver_id === id && t.status === 'ongoing');
    
    if (activeTrip) {
        showToast('Cannot delete driver. Assigned to an ongoing trip.', 'error');
        return;
    }

    let drivers = getDrivers();
    drivers = drivers.filter(d => d.id !== id);
    localStorage.setItem('hpgas_drivers', JSON.stringify(drivers));
    
    showToast('Driver deleted successfully', 'success');
    loadDrivers();
}

// ==================== LOADMEN ====================

function loadLoadmen() {
    const user = getCurrentUser();
    const loadmen = getLoadmen().filter(l => l.godown_id === user.godown_id);

    let html = '';

    if (loadmen.length === 0) {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p class="text-gray-500 font-medium">No loadmen added</p>
                <button onclick="openAddLoadmanModal()" class="btn btn-primary btn-sm mt-4">
                    Add Loadman
                </button>
            </div>
        `;
    } else {
        loadmen.forEach((loadman, index) => {
            const statusColor = loadman.status === 'active' ? 'badge-success' : 'badge-secondary';

            html += `
                <div class="card card-compact animate-slide-up" style="animation-delay: ${index * 0.05}s">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900">${loadman.name}</h3>
                                <p class="text-sm text-gray-600">${loadman.phone}</p>
                            </div>
                        </div>
                        <span class="badge ${statusColor} capitalize">${loadman.status}</span>
                    </div>

                    <div class="flex gap-2 pt-3 border-t border-gray-200">
                        <button onclick="editLoadman(${loadman.id})" class="flex-1 btn btn-secondary btn-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                        </button>
                        <button onclick="deleteLoadman(${loadman.id}, '${loadman.name}')" class="flex-1 btn btn-secondary btn-sm text-red-600 hover:bg-red-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
    }

    $('#loadmenList').html(html);
}

function openAddLoadmanModal() {
    $('#loadmanModalTitle').text('Add Loadman');
    $('#loadmanForm')[0].reset();
    $('#loadmanId').val('');
    $('#loadmanModal').removeClass('hidden');
}

function editLoadman(id) {
    const loadmen = getLoadmen();
    const loadman = loadmen.find(l => l.id === id);
    
    if (!loadman) return;

    $('#loadmanModalTitle').text('Edit Loadman');
    $('#loadmanId').val(loadman.id);
    $('#loadmanName').val(loadman.name);
    $('#loadmanPhone').val(loadman.phone);
    $('#loadmanStatus').val(loadman.status);
    
    $('#loadmanModal').removeClass('hidden');
}

function closeLoadmanModal() {
    $('#loadmanModal').addClass('hidden');
}

function saveLoadman() {
    const user = getCurrentUser();
    const loadmanId = $('#loadmanId').val();
    const name = $('#loadmanName').val().trim();
    const phone = $('#loadmanPhone').val().trim();
    const status = $('#loadmanStatus').val();

    if (!name || !phone) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    let loadmen = getLoadmen();

    if (loadmanId) {
        // Edit existing
        const index = loadmen.findIndex(l => l.id == loadmanId);
        if (index !== -1) {
            loadmen[index].name = name;
            loadmen[index].phone = phone;
            loadmen[index].status = status;
        }
        showToast('Loadman updated successfully', 'success');
    } else {
        // Add new
        const newId = loadmen.length > 0 ? Math.max(...loadmen.map(l => l.id)) + 1 : 1;
        loadmen.push({
            id: newId,
            name: name,
            phone: phone,
            godown_id: user.godown_id,
            status: status,
            created_at: new Date().toISOString()
        });
        showToast('Loadman added successfully', 'success');
    }

    localStorage.setItem('hpgas_loadmen', JSON.stringify(loadmen));
    loadLoadmen();
    loadVehicles(); // Refresh vehicles to show updated loadman names
    closeLoadmanModal();
}

function deleteLoadman(id, name) {
    if (!confirm(`Are you sure you want to delete loadman ${name}?`)) {
        return;
    }

    // Check if loadman is assigned to any vehicle
    const vehicles = getVehicles();
    const assignedVehicle = vehicles.find(v => 
        v.primary_loadman1_id === id || v.primary_loadman2_id === id
    );
    
    if (assignedVehicle) {
        showToast('Cannot delete loadman. Remove from vehicle assignment first.', 'error');
        return;
    }

    let loadmen = getLoadmen();
    loadmen = loadmen.filter(l => l.id !== id);
    localStorage.setItem('hpgas_loadmen', JSON.stringify(loadmen));
    
    showToast('Loadman deleted successfully', 'success');
    loadLoadmen();
}

// ==================== HELPER FUNCTIONS ====================

function loadDriversDropdown() {
    const user = getCurrentUser();
    const drivers = getDrivers().filter(d => d.godown_id === user.godown_id && d.status === 'active');
    const users = getUsers().filter(u => u.role === 'driver' && u.godown_id === user.godown_id);

    let html = '<option value="">-- Select Driver --</option>';
    [...drivers, ...users].forEach(driver => {
        html += `<option value="${driver.id}">${driver.name}</option>`;
    });

    $('#primaryDriver').html(html);
}

function loadLoadmenDropdown() {
    const user = getCurrentUser();
    const loadmen = getLoadmen().filter(l => l.godown_id === user.godown_id && l.status === 'active');

    let html = '<option value="">-- Select Loadman --</option>';
    loadmen.forEach(loadman => {
        html += `<option value="${loadman.id}">${loadman.name}</option>`;
    });

    $('#primaryLoadman1').html(html);
    $('#primaryLoadman2').html(html);
}