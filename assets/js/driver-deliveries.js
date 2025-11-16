// Driver Deliveries - Nearby Customers JavaScript

let currentLocation = null;
let allCustomers = [];
let filteredCustomers = [];

$(document).ready(function() {
    const user = checkAuth();
    if (!user || user.role !== 'driver') {
        logout();
        return;
    }

    // Request location
    requestLocation();
    
    // Load customers
    allCustomers = getCustomers();
    
    // Search functionality
    $('#searchCustomer').on('input', function() {
        filterCustomers();
    });
    
    // Filter buttons
    $('.filter-btn').click(function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        filterCustomers();
    });
});

function requestLocation() {
    $('#loadingState').removeClass('hidden');
    $('#customersList').addClass('hidden');
    
    if (!navigator.geolocation) {
        $('#locationPermission').removeClass('hidden');
        $('#loadingState').addClass('hidden');
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            $('#currentLat').text(currentLocation.lat.toFixed(6));
            $('#currentLng').text(currentLocation.lng.toFixed(6));
            $('#locationStatus').text('Location detected');
            
            // Reverse geocode to get address (mock for now)
            $('#currentLocation').text(`${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`);
            
            $('#locationPermission').addClass('hidden');
            filterCustomers();
        },
        function(error) {
            console.error('Location error:', error);
            $('#locationPermission').removeClass('hidden');
            $('#loadingState').addClass('hidden');
            showToast('Unable to get your location', 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function refreshLocation() {
    $('#refreshBtn').addClass('animate-spin');
    requestLocation();
    setTimeout(() => {
        $('#refreshBtn').removeClass('animate-spin');
    }, 1000);
}

function filterCustomers() {
    const searchQuery = $('#searchCustomer').val().toLowerCase();
    const activeFilter = $('.filter-btn.active').data('filter');
    
    filteredCustomers = allCustomers.filter(customer => {
        // Search filter
        const matchesSearch = !searchQuery || 
            customer.name.toLowerCase().includes(searchQuery) ||
            customer.business_type.toLowerCase().includes(searchQuery) ||
            customer.address.toLowerCase().includes(searchQuery);
        
        if (!matchesSearch) return false;
        
        // Business type filter
        if (activeFilter !== 'all' && activeFilter !== 'nearby') {
            if (customer.business_type.toLowerCase() !== activeFilter) {
                return false;
            }
        }
        
        // Nearby filter (< 5km)
        if (activeFilter === 'nearby' && currentLocation) {
            const distance = calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                customer.latitude,
                customer.longitude
            );
            if (distance >= 5) return false;
        }
        
        return true;
    });
    
    // Sort by distance if location available
    if (currentLocation) {
        filteredCustomers.sort((a, b) => {
            const distA = calculateDistance(currentLocation.lat, currentLocation.lng, a.latitude, a.longitude);
            const distB = calculateDistance(currentLocation.lat, currentLocation.lng, b.latitude, b.longitude);
            return distA - distB;
        });
    }
    
    displayCustomers();
}

function displayCustomers() {
    $('#loadingState').addClass('hidden');
    
    if (filteredCustomers.length === 0) {
        $('#customersList').addClass('hidden');
        $('#emptyState').removeClass('hidden');
        return;
    }
    
    $('#emptyState').addClass('hidden');
    $('#customersList').removeClass('hidden');
    
    let html = '';
    
    filteredCustomers.forEach((customer, index) => {
        let distance = 'N/A';
        if (currentLocation) {
            const dist = calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                customer.latitude,
                customer.longitude
            );
            distance = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
        }
        
        html += `
            <div class="card cursor-pointer hover:shadow-lg transition-all animate-slide-up" 
                 style="animation-delay: ${index * 0.05}s"
                 onclick="selectCustomer(${customer.id})">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-900">${customer.name}</h3>
                            <p class="text-sm text-gray-600">${customer.business_type}</p>
                            <p class="text-sm text-gray-500 mt-1">${customer.address}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center gap-1 text-orange-600">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <span class="text-sm font-semibold">${distance}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="event.stopPropagation(); callCustomer(${customer.id})" class="flex-1 btn btn-secondary btn-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        Call
                    </button>
                    <button onclick="event.stopPropagation(); navigateToCustomer(${customer.latitude}, ${customer.longitude})" class="flex-1 btn btn-secondary btn-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                        </svg>
                        Navigate
                    </button>
                </div>
            </div>
        `;
    });
    
    $('#customersList').html(html);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

function selectCustomer(customerId) {
    // Redirect to make delivery page
    window.location.href = `driver-make-delivery.html?customer=${customerId}`;
}

function callCustomer(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (customer && customer.phone) {
        window.location.href = `tel:${customer.phone}`;
    } else {
        showToast('Customer phone not available', 'error');
    }
}

function navigateToCustomer(lat, lng) {
    // Open Google Maps navigation
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}