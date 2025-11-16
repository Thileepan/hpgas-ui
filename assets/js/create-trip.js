// Manager Create Trip JavaScript

let loadItemCounter = 0;

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

    // Check URL parameters for trip type
    const urlParams = new URLSearchParams(window.location.search);
    const tripType = urlParams.get('type');
    if (tripType === 'refill') {
        switchTripType('refill');
    }

    // Initialize
    loadVehicles();
    loadDrivers();
    loadLoadmen();
    loadFillingStations();
    generateDCNumber();
    setCurrentDateTime();

    // Event Listeners
    $('#deliveryTypeBtn').click(function() {
        switchTripType('delivery');
    });

    $('#refillTypeBtn').click(function() {
        switchTripType('refill');
    });

    $('#vehicleSelect').change(function() {
        loadVehicleDetails();
    });

    $('#toggleCrewOverride').click(function() {
        $('#crewOverrideSection').slideToggle();
    });

    $('#addLoadBtn').click(function() {
        addLoadItem();
    });

    $('#createTripForm').submit(function(e) {
        e.preventDefault();
        createTrip();
    });
});

function switchTripType(type) {
    $('#tripType').val(type);
    
    if (type === 'delivery') {
        $('#deliveryTypeBtn').addClass('active');
        $('#refillTypeBtn').removeClass('active');
        $('#pageTitle').text('Create Delivery Trip');
        $('#fillingStationSection').slideUp();
        $('#fillingStationSelect').prop('required', false);
    } else {
        $('#deliveryTypeBtn').removeClass('active');
        $('#refillTypeBtn').addClass('active');
        $('#pageTitle').text('Create Refill Trip');
        $('#fillingStationSection').slideDown();
        $('#fillingStationSelect').prop('required', true);
    }
}

function generateDCNumber() {
    const trips = getTrips();
    const year = new Date().getFullYear();
    
    // Get the last DC number for this year
    const yearTrips = trips.filter(t => t.dc_number.includes(`DC/${year}/`));
    let maxNumber = 0;
    
    yearTrips.forEach(trip => {
        const parts = trip.dc_number.split('/');
        const num = parseInt(parts[2]);
        if (num > maxNumber) {
            maxNumber = num;
        }
    });
    
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    const dcNumber = `DC/${year}/${nextNumber}`;
    
    $('#dcNumber').text(dcNumber);
}

function loadVehicles() {
    const user = getCurrentUser();
    const vehicles = getVehicles().filter(v => v.godown_id === user.godown_id && v.status === 'active');
    
    let html = '<option value="">-- Select Vehicle --</option>';
    vehicles.forEach(vehicle => {
        html += `<option value="${vehicle.id}">${vehicle.vehicle_number} (${vehicle.vehicle_type})</option>`;
    });
    
    $('#vehicleSelect').html(html);
}

function loadDrivers() {
    const user = getCurrentUser();
    const drivers = getDrivers().filter(d => d.godown_id === user.godown_id && d.status === 'active');
    const users = getUsers().filter(u => u.role === 'driver' && u.godown_id === user.godown_id);
    
    let html = '<option value="">-- Use primary driver --</option>';
    
    [...drivers, ...users].forEach(driver => {
        html += `<option value="${driver.id}">${driver.name}</option>`;
    });
    
    $('#driverOverride').html(html);
}

function loadLoadmen() {
    const user = getCurrentUser();
    const loadmen = getLoadmen().filter(l => l.godown_id === user.godown_id && l.status === 'active');
    
    let html = '<option value="">-- Select Loadman --</option>';
    loadmen.forEach(loadman => {
        html += `<option value="${loadman.id}">${loadman.name}</option>`;
    });
    
    $('#loadman1Override').html(html);
    $('#loadman2Override').html(html);
}

function loadFillingStations() {
    const stations = getFillingStations();
    
    let html = '<option value="">-- Select Filling Station --</option>';
    stations.forEach(station => {
        html += `<option value="${station.id}">${station.name}</option>`;
    });
    
    $('#fillingStationSelect').html(html);
}

function loadVehicleDetails() {
    const vehicleId = parseInt($('#vehicleSelect').val());
    
    if (!vehicleId) {
        $('#vehicleDetails').hide();
        return;
    }
    
    const vehicles = getVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    if (!vehicle) return;
    
    // Get driver and loadmen details
    const users = getUsers();
    const drivers = getDrivers();
    const loadmen = getLoadmen();
    
    const driver = users.find(u => u.id === vehicle.primary_driver_id) || drivers.find(d => d.id === vehicle.primary_driver_id);
    const loadman1 = loadmen.find(l => l.id === vehicle.primary_loadman1_id);
    const loadman2 = loadmen.find(l => l.id === vehicle.primary_loadman2_id);
    
    $('#vehicleDriver').text(driver ? driver.name : 'Not assigned');
    $('#vehicleLoadman1').text(loadman1 ? loadman1.name : 'Not assigned');
    $('#vehicleLoadman2').text(loadman2 ? loadman2.name : 'Not assigned');
    
    $('#vehicleDetails').slideDown();
}

function setCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    $('#startTime').val(dateTimeLocal);
}

function addLoadItem() {
    loadItemCounter++;
    
    const html = `
        <div class="load-item p-4 bg-gray-50 rounded-lg border border-gray-200" data-id="${loadItemCounter}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">Load Item #${loadItemCounter}</h4>
                <button type="button" class="remove-load-btn text-red-500 hover:text-red-600" onclick="removeLoadItem(${loadItemCounter})">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Provider *</label>
                    <select class="load-provider w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="HP">HP</option>
                        <option value="Indane">Indane</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Weight (kg) *</label>
                    <select class="load-kg w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="5">5 kg</option>
                        <option value="19">19 kg</option>
                        <option value="35">35 kg</option>
                        <option value="47.5">47.5 kg</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                    <select class="load-type w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="filled">Filled</option>
                        <option value="empty">Empty</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" class="load-quantity w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" min="1" placeholder="0" required>
                </div>
            </div>
        </div>
    `;
    
    $('#emptyLoadState').hide();
    $('#loadItemsContainer').append(html);
}

function removeLoadItem(id) {
    $(`.load-item[data-id="${id}"]`).fadeOut(300, function() {
        $(this).remove();
        
        if ($('.load-item').length === 0) {
            $('#emptyLoadState').show();
        }
    });
}

function createTrip() {
    // Validate form
    const vehicleId = parseInt($('#vehicleSelect').val());
    const startKm = parseInt($('#startKm').val());
    const startTime = $('#startTime').val();
    const tripType = $('#tripType').val();
    
    if (!vehicleId) {
        showToast('Please select a vehicle', 'error');
        return;
    }
    
    if (!startKm || startKm < 0) {
        showToast('Please enter valid starting KM', 'error');
        return;
    }
    
    if (!startTime) {
        showToast('Please enter start time', 'error');
        return;
    }
    
    // Check if refill trip needs filling station
    let fillingStationId = null;
    if (tripType === 'refill') {
        fillingStationId = parseInt($('#fillingStationSelect').val());
        if (!fillingStationId) {
            showToast('Please select a filling station', 'error');
            return;
        }
    }
    
    // Get load details
    const loadDetails = [];
    let hasError = false;
    
    $('.load-item').each(function() {
        const provider = $(this).find('.load-provider').val();
        const kg = $(this).find('.load-kg').val();
        const type = $(this).find('.load-type').val();
        const quantity = parseInt($(this).find('.load-quantity').val());
        
        if (!provider || !kg || !type || !quantity) {
            hasError = true;
            return false;
        }
        
        loadDetails.push({
            provider: provider,
            kg: kg,
            type: type,
            quantity: quantity
        });
    });
    
    if (loadDetails.length === 0) {
        showToast('Please add at least one load item', 'error');
        return;
    }
    
    if (hasError) {
        showToast('Please fill all load item fields', 'error');
        return;
    }
    
    // Get vehicle details
    const vehicles = getVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    
    // Get crew (check for overrides)
    const driverOverride = parseInt($('#driverOverride').val());
    const loadman1Override = parseInt($('#loadman1Override').val());
    const loadman2Override = parseInt($('#loadman2Override').val());
    
    const driverId = driverOverride || vehicle.primary_driver_id;
    const loadman1Id = loadman1Override || vehicle.primary_loadman1_id;
    const loadman2Id = loadman2Override || vehicle.primary_loadman2_id;
    
    // Get user and godown
    const user = getCurrentUser();
    
    // Create trip object
    const trips = getTrips();
    const newTripId = trips.length > 0 ? Math.max(...trips.map(t => t.id)) + 1 : 1;
    
    const trip = {
        id: newTripId,
        dc_number: $('#dcNumber').text(),
        trip_type: tripType,
        godown_id: user.godown_id,
        vehicle_id: vehicleId,
        driver_id: driverId,
        loadman1_id: loadman1Id,
        loadman2_id: loadman2Id,
        filling_station_id: fillingStationId,
        start_km: startKm,
        start_time: startTime,
        end_km: null,
        end_time: null,
        status: 'ongoing',
        created_by: user.id,
        created_at: new Date().toISOString(),
        load_details: loadDetails
    };
    
    // Save trip
    trips.push(trip);
    saveTrips(trips);
    
    // Update inventory (reduce stock)
    updateInventoryForTrip(trip, 'outward');
    
    showToast('Trip created successfully!', 'success');
    
    // Redirect to trips page
    setTimeout(() => {
        window.location.href = 'trips.html';
    }, 1000);
}

function updateInventoryForTrip(trip, direction) {
    const inventory = getInventory();
    
    trip.load_details.forEach(load => {
        const invItem = inventory.find(i => 
            i.godown_id === trip.godown_id &&
            i.provider === load.provider &&
            i.kg === load.kg
        );
        
        if (!invItem) return;
        
        if (direction === 'outward') {
            // Moving out - reduce stock, increase in_transit
            if (load.type === 'filled') {
                invItem.filled = Math.max(0, invItem.filled - load.quantity);
                invItem.in_transit += load.quantity;
            } else if (load.type === 'empty') {
                invItem.empty = Math.max(0, invItem.empty - load.quantity);
                invItem.in_transit += load.quantity;
            }
        } else if (direction === 'inward') {
            // Coming back - reduce in_transit, increase stock
            invItem.in_transit = Math.max(0, invItem.in_transit - load.quantity);
            if (load.type === 'filled') {
                invItem.filled += load.quantity;
            } else if (load.type === 'empty') {
                invItem.empty += load.quantity;
            }
        }
    });
    
    saveInventory(inventory);
}