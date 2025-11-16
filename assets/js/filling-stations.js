// Filling Stations Management JavaScript

let currentFilter = 'all';
let allStations = [];
let filteredStations = [];

$(document).ready(function() {
    const user = checkAuth();
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
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

    // Load stations
    loadStations();

    // Search functionality
    $('#searchStation').on('input', function() {
        filterStations();
    });

    // Filter buttons
    $('.filter-btn').click(function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        filterStations();
    });

    // Form handler
    $('#stationForm').submit(function(e) {
        e.preventDefault();
        saveStation();
    });
});

function loadStations() {
    allStations = getFillingStations();
    filterStations();
    updateStats();
}

function updateStats() {
    const total = allStations.length;
    const active = allStations.filter(s => s.status === 'active').length;
    
    // Get unique providers
    const providers = new Set();
    allStations.forEach(station => {
        if (station.providers && Array.isArray(station.providers)) {
            station.providers.forEach(p => providers.add(p));
        }
    });

    $('#totalStations').text(total);
    $('#activeStations').text(active);
    $('#providerCount').text(providers.size);
}

function filterStations() {
    const searchQuery = $('#searchStation').val().toLowerCase();

    filteredStations = allStations.filter(station => {
        // Search filter
        const matchesSearch = !searchQuery || 
            station.name.toLowerCase().includes(searchQuery) ||
            station.address.toLowerCase().includes(searchQuery) ||
            (station.city && station.city.toLowerCase().includes(searchQuery)) ||
            (station.contact_person && station.contact_person.toLowerCase().includes(searchQuery)) ||
            (station.phone && station.phone.includes(searchQuery));

        if (!matchesSearch) return false;

        // Status/Provider filter
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active' || currentFilter === 'inactive' || currentFilter === 'maintenance') {
            return station.status === currentFilter;
        }
        // Provider filter
        return station.providers && station.providers.includes(currentFilter);
    });

    displayStations();
}

function displayStations() {
    if (filteredStations.length === 0) {
        $('#stationsList').addClass('hidden');
        $('#emptyState').removeClass('hidden');
        return;
    }

    $('#emptyState').addClass('hidden');
    $('#stationsList').removeClass('hidden');

    let html = '';

    filteredStations.forEach((station, index) => {
        const statusBadge = getStatusBadge(station.status);
        
        // Provider badges
        let providerBadges = '';
        if (station.providers && station.providers.length > 0) {
            station.providers.forEach(provider => {
                const badgeColor = getProviderColor(provider);
                providerBadges += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeColor}">${provider}</span> `;
            });
        }

        html += `
            <div class="card animate-slide-up" style="animation-delay: ${index * 0.05}s">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-900">${station.name}</h3>
                            <p class="text-sm text-gray-500 mt-1">${station.address}</p>
                            ${station.city ? `<p class="text-sm text-gray-500">${station.city}${station.pincode ? ' - ' + station.pincode : ''}</p>` : ''}
                        </div>
                    </div>
                    ${statusBadge}
                </div>

                <div class="flex flex-wrap gap-2 mb-4">
                    ${providerBadges}
                </div>

                <div class="space-y-2 mb-4">
                    ${station.contact_person ? `
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>${station.contact_person}</span>
                        </div>
                    ` : ''}
                    ${station.phone ? `
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <a href="tel:${station.phone}" class="text-orange-600 hover:text-orange-700">${station.phone}</a>
                        </div>
                    ` : ''}
                </div>

                <div class="flex gap-2 pt-3 border-t border-gray-200">
                    <button onclick="viewStationDetails(${station.id})" class="flex-1 btn btn-secondary btn-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        View
                    </button>
                    <button onclick="editStation(${station.id})" class="flex-1 btn btn-secondary btn-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                    </button>
                    ${station.phone ? `
                        <button onclick="callStation('${station.phone}')" class="btn btn-secondary btn-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                        </button>
                    ` : ''}
                    <button onclick="deleteStation(${station.id}, '${station.name}')" class="btn btn-secondary btn-sm text-red-600 hover:bg-red-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    $('#stationsList').html(html);
}

function getStatusBadge(status) {
    const badges = {
        'active': '<span class="badge badge-success">Active</span>',
        'inactive': '<span class="badge badge-secondary">Inactive</span>',
        'maintenance': '<span class="badge badge-warning">Maintenance</span>'
    };
    return badges[status] || badges['inactive'];
}

function getProviderColor(provider) {
    const colors = {
        'HP Gas': 'bg-orange-100 text-orange-700',
        'Indane': 'bg-blue-100 text-blue-700'
    };
    return colors[provider] || 'bg-gray-100 text-gray-700';
}

function openAddStationModal() {
    $('#stationModalTitle').text('Add Filling Station');
    $('#stationForm')[0].reset();
    $('#stationId').val('');
    $('#stationStatus').val('active');
    
    // Uncheck all providers
    $('#providerHP, #providerIndane').prop('checked', false);
    
    $('#stationModal').removeClass('hidden');
}

function editStation(id) {
    const station = allStations.find(s => s.id === id);
    if (!station) return;

    $('#stationModalTitle').text('Edit Filling Station');
    $('#stationId').val(station.id);
    $('#stationName').val(station.name);
    $('#stationStatus').val(station.status);
    $('#stationAddress').val(station.address);
    $('#stationCity').val(station.city || '');
    $('#stationPincode').val(station.pincode || '');
    $('#stationLatitude').val(station.latitude || '');
    $('#stationLongitude').val(station.longitude || '');
    
    // Contact info
    $('#contactPerson').val(station.contact_person || '');
    $('#contactPhone').val(station.phone || '');
    $('#alternatePhone').val(station.alternate_phone || '');
    $('#contactEmail').val(station.email || '');
    
    // Notes
    $('#stationNotes').val(station.notes || '');
    
    // Providers
    $('#providerHP').prop('checked', station.providers && station.providers.includes('HP Gas'));
    $('#providerIndane').prop('checked', station.providers && station.providers.includes('Indane'));
    
    $('#stationModal').removeClass('hidden');
}

function closeStationModal() {
    $('#stationModal').addClass('hidden');
}

function saveStation() {
    const stationId = $('#stationId').val();
    
    // Validate required fields
    const name = $('#stationName').val().trim();
    const address = $('#stationAddress').val().trim();
    const city = $('#stationCity').val().trim();
    const pincode = $('#stationPincode').val().trim();
    const contactPerson = $('#contactPerson').val().trim();
    const phone = $('#contactPhone').val().trim();
    
    if (!name || !address || !city || !pincode || !contactPerson || !phone) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    // Get selected providers
    const providers = [];
    if ($('#providerHP').is(':checked')) providers.push('HP Gas');
    if ($('#providerIndane').is(':checked')) providers.push('Indane');

    if (providers.length === 0) {
        showToast('Please select at least one gas provider', 'error');
        return;
    }

    const stationData = {
        name: name,
        status: $('#stationStatus').val(),
        address: address,
        city: city,
        pincode: pincode,
        latitude: parseFloat($('#stationLatitude').val()) || null,
        longitude: parseFloat($('#stationLongitude').val()) || null,
        contact_person: contactPerson,
        phone: phone,
        alternate_phone: $('#alternatePhone').val().trim() || '',
        email: $('#contactEmail').val().trim() || '',
        providers: providers,
        notes: $('#stationNotes').val().trim() || ''
    };

    let stations = getFillingStations();

    if (stationId) {
        // Edit existing
        const index = stations.findIndex(s => s.id == stationId);
        if (index !== -1) {
            stations[index] = { ...stations[index], ...stationData };
        }
        showToast('Filling station updated successfully', 'success');
    } else {
        // Add new
        const newId = stations.length > 0 ? Math.max(...stations.map(s => s.id)) + 1 : 1;
        stations.push({
            id: newId,
            ...stationData,
            created_at: new Date().toISOString()
        });
        showToast('Filling station added successfully', 'success');
    }

    localStorage.setItem('hpgas_filling_stations', JSON.stringify(stations));
    loadStations();
    closeStationModal();
}

function deleteStation(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    // Check if station is used in any refill trips
    const trips = getTrips();
    const stationTrips = trips.filter(t => t.filling_station_id === id);
    
    if (stationTrips.length > 0) {
        if (!confirm(`This station has ${stationTrips.length} trip record(s). Are you sure you want to proceed with deletion?`)) {
            return;
        }
    }

    let stations = getFillingStations();
    stations = stations.filter(s => s.id !== id);
    localStorage.setItem('hpgas_filling_stations', JSON.stringify(stations));
    
    showToast('Filling station deleted successfully', 'success');
    loadStations();
}

function viewStationDetails(id) {
    const station = allStations.find(s => s.id === id);
    if (!station) return;

    const statusBadge = getStatusBadge(station.status);
    
    // Provider badges
    let providerBadges = '';
    if (station.providers && station.providers.length > 0) {
        station.providers.forEach(provider => {
            const badgeColor = getProviderColor(provider);
            providerBadges += `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${badgeColor} mr-2">${provider}</span>`;
        });
    }

    // Get refill trip count
    const trips = getTrips();
    const stationTrips = trips.filter(t => t.filling_station_id === id);
    const totalTrips = stationTrips.length;
    const lastTrip = stationTrips.length > 0 
        ? new Date(stationTrips[stationTrips.length - 1].created_at).toLocaleDateString('en-IN')
        : 'No trips yet';

    let html = `
        <div class="space-y-6">
            <!-- Basic Info -->
            <div>
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-gray-900">${station.name}</h4>
                    ${statusBadge}
                </div>
                <div class="space-y-2">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <div>
                            <p class="text-sm font-medium text-gray-900">Address</p>
                            <p class="text-sm text-gray-600">${station.address}</p>
                            <p class="text-sm text-gray-600">${station.city}${station.pincode ? ' - ' + station.pincode : ''}</p>
                        </div>
                    </div>
                    ${station.latitude && station.longitude ? `
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                            </svg>
                            <div>
                                <p class="text-sm font-medium text-gray-900">Coordinates</p>
                                <p class="text-sm text-gray-600">${station.latitude}, ${station.longitude}</p>
                                <a href="https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}" target="_blank" class="text-sm text-orange-600 hover:text-orange-700">View on Map →</a>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Gas Providers -->
            <div class="pt-6 border-t border-gray-200">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Gas Providers</h4>
                <div class="flex flex-wrap gap-2">
                    ${providerBadges || '<span class="text-sm text-gray-500">No providers specified</span>'}
                </div>
            </div>

            <!-- Contact Information -->
            <div class="pt-6 border-t border-gray-200">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div class="space-y-2">
                    ${station.contact_person ? `
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span class="text-sm text-gray-900">${station.contact_person}</span>
                        </div>
                    ` : ''}
                    ${station.phone ? `
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <a href="tel:${station.phone}" class="text-sm text-orange-600 hover:text-orange-700">${station.phone}</a>
                        </div>
                    ` : ''}
                    ${station.alternate_phone ? `
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <a href="tel:${station.alternate_phone}" class="text-sm text-orange-600 hover:text-orange-700">${station.alternate_phone} <span class="text-gray-500">(Alt)</span></a>
                        </div>
                    ` : ''}
                    ${station.email ? `
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <a href="mailto:${station.email}" class="text-sm text-orange-600 hover:text-orange-700">${station.email}</a>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Refill History -->
            <div class="pt-6 border-t border-gray-200">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Refill History</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">Total Refill Trips</p>
                        <p class="text-2xl font-bold text-gray-900">${totalTrips}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">Last Refill Trip</p>
                        <p class="text-sm font-semibold text-gray-900">${lastTrip}</p>
                    </div>
                </div>
            </div>

            ${station.notes ? `
                <div class="pt-6 border-t border-gray-200">
                    <h4 class="text-md font-semibold text-gray-900 mb-3">Notes</h4>
                    <p class="text-sm text-gray-600">${station.notes}</p>
                </div>
            ` : ''}

            <!-- Actions -->
            <div class="pt-6 border-t border-gray-200">
                <div class="flex gap-3">
                    <button onclick="editStation(${station.id}); closeStationDetailsModal();" class="flex-1 btn btn-primary">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit Station
                    </button>
                    ${station.phone ? `
                        <button onclick="callStation('${station.phone}')" class="btn btn-secondary">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    $('#stationDetailsContent').html(html);
    $('#stationDetailsModal').removeClass('hidden');
}

function closeStationDetailsModal() {
    $('#stationDetailsModal').addClass('hidden');
}

function callStation(phone) {
    window.location.href = `tel:${phone}`;
}

function getStationCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }

    showToast('Getting your location...', 'warning');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            $('#stationLatitude').val(position.coords.latitude.toFixed(6));
            $('#stationLongitude').val(position.coords.longitude.toFixed(6));
            showToast('Location captured successfully', 'success');
        },
        function(error) {
            showToast('Unable to get your location', 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}