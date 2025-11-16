// Customer Management JavaScript

let currentFilter = 'all';
let allCustomers = [];
let filteredCustomers = [];

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

    // Load customers
    loadCustomers();

    // Search functionality
    $('#searchCustomer').on('input', function() {
        filterCustomers();
    });

    // Filter buttons
    $('.filter-btn').click(function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        filterCustomers();
    });

    // Form handler
    $('#customerForm').submit(function(e) {
        e.preventDefault();
        saveCustomer();
    });
});

function loadCustomers() {
    const user = getCurrentUser();
    allCustomers = getCustomers().filter(c => c.godown_id === user.godown_id);
    filterCustomers();
    updateStats();
}

function updateStats() {
    const total = allCustomers.length;
    const active = allCustomers.filter(c => c.status === 'active').length;
    const businessTypes = [...new Set(allCustomers.map(c => c.business_type))].length;

    $('#totalCustomers').text(total);
    $('#activeCustomers').text(active);
    $('#businessTypes').text(businessTypes);
}

function filterCustomers() {
    const searchQuery = $('#searchCustomer').val().toLowerCase();

    filteredCustomers = allCustomers.filter(customer => {
        // Search filter
        const matchesSearch = !searchQuery || 
            customer.name.toLowerCase().includes(searchQuery) ||
            customer.business_type.toLowerCase().includes(searchQuery) ||
            customer.address.toLowerCase().includes(searchQuery) ||
            customer.primary_contact.phone.includes(searchQuery) ||
            (customer.primary_contact.name && customer.primary_contact.name.toLowerCase().includes(searchQuery));

        if (!matchesSearch) return false;

        // Status/Type filter
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active' || currentFilter === 'inactive') {
            return customer.status === currentFilter;
        }
        return customer.business_type.toLowerCase() === currentFilter;
    });

    displayCustomers();
}

function displayCustomers() {
    if (filteredCustomers.length === 0) {
        $('#customersList').addClass('hidden');
        $('#emptyState').removeClass('hidden');
        return;
    }

    $('#emptyState').addClass('hidden');
    $('#customersList').removeClass('hidden');

    let html = '';

    filteredCustomers.forEach((customer, index) => {
        const statusBadge = customer.status === 'active' 
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-secondary">Inactive</span>';

        // Get business type icon
        const iconPath = getBusinessTypeIcon(customer.business_type);

        html += `
            <div class="card animate-slide-up" style="animation-delay: ${index * 0.05}s">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${iconPath}
                            </svg>
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-900">${customer.name}</h3>
                            <p class="text-sm text-gray-600">${customer.business_type}</p>
                            <p class="text-sm text-gray-500 mt-1">${customer.address}</p>
                        </div>
                    </div>
                    ${statusBadge}
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>${customer.primary_contact.name}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <a href="tel:${customer.primary_contact.phone}" class="text-orange-600 hover:text-orange-700">${customer.primary_contact.phone}</a>
                    </div>
                    ${customer.primary_contact.whatsapp ? `
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <a href="https://wa.me/${customer.primary_contact.whatsapp.replace(/\D/g, '')}" target="_blank" class="text-green-600 hover:text-green-700">${customer.primary_contact.whatsapp}</a>
                        </div>
                    ` : ''}
                </div>

                <div class="flex gap-2 pt-3 border-t border-gray-200">
                    <button onclick="viewCustomerDetails(${customer.id})" class="flex-1 btn btn-secondary btn-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        View
                    </button>
                    <button onclick="editCustomer(${customer.id})" class="flex-1 btn btn-secondary btn-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                    </button>
                    <button onclick="callCustomer('${customer.primary_contact.phone}')" class="btn btn-secondary btn-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteCustomer(${customer.id}, '${customer.name}')" class="btn btn-secondary btn-sm text-red-600 hover:bg-red-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    $('#customersList').html(html);
}

function getBusinessTypeIcon(type) {
    const icons = {
        'Restaurant': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>',
        'Hotel': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>',
        'Hospital': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>',
        'School': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>',
        'Factory': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>',
        'Catering': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>',
        'Other': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>'
    };
    return icons[type] || icons['Other'];
}

function openAddCustomerModal() {
    $('#customerModalTitle').text('Add Customer');
    $('#customerForm')[0].reset();
    $('#customerId').val('');
    $('#customerStatus').val('active');
    $('#customerModal').removeClass('hidden');
}

function editCustomer(id) {
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    $('#customerModalTitle').text('Edit Customer');
    $('#customerId').val(customer.id);
    $('#businessName').val(customer.name);
    $('#businessType').val(customer.business_type);
    $('#customerStatus').val(customer.status);
    $('#address').val(customer.address);
    $('#city').val(customer.city || '');
    $('#pincode').val(customer.pincode || '');
    $('#latitude').val(customer.latitude || '');
    $('#longitude').val(customer.longitude || '');
    
    // Primary contact
    $('#primaryContactName').val(customer.primary_contact.name);
    $('#primaryPhone').val(customer.primary_contact.phone);
    $('#primaryWhatsapp').val(customer.primary_contact.whatsapp || '');
    $('#primaryEmail').val(customer.primary_contact.email || '');
    
    // Secondary contact
    if (customer.secondary_contact) {
        $('#secondaryContactName').val(customer.secondary_contact.name || '');
        $('#secondaryPhone').val(customer.secondary_contact.phone || '');
        $('#secondaryWhatsapp').val(customer.secondary_contact.whatsapp || '');
        $('#secondaryEmail').val(customer.secondary_contact.email || '');
    }
    
    $('#notes').val(customer.notes || '');
    
    $('#customerModal').removeClass('hidden');
}

function closeCustomerModal() {
    $('#customerModal').addClass('hidden');
}

function saveCustomer() {
    const user = getCurrentUser();
    const customerId = $('#customerId').val();
    
    // Validate required fields
    const businessName = $('#businessName').val().trim();
    const businessType = $('#businessType').val();
    const address = $('#address').val().trim();
    const primaryContactName = $('#primaryContactName').val().trim();
    const primaryPhone = $('#primaryPhone').val().trim();
    
    if (!businessName || !businessType || !address || !primaryContactName || !primaryPhone) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    const customerData = {
        name: businessName,
        business_type: businessType,
        status: $('#customerStatus').val(),
        address: address,
        city: $('#city').val().trim() || '',
        pincode: $('#pincode').val().trim() || '',
        latitude: parseFloat($('#latitude').val()) || null,
        longitude: parseFloat($('#longitude').val()) || null,
        primary_contact: {
            name: primaryContactName,
            phone: primaryPhone,
            whatsapp: $('#primaryWhatsapp').val().trim() || '',
            email: $('#primaryEmail').val().trim() || ''
        },
        secondary_contact: {
            name: $('#secondaryContactName').val().trim() || '',
            phone: $('#secondaryPhone').val().trim() || '',
            whatsapp: $('#secondaryWhatsapp').val().trim() || '',
            email: $('#secondaryEmail').val().trim() || ''
        },
        notes: $('#notes').val().trim() || '',
        godown_id: user.godown_id
    };

    let customers = getCustomers();

    if (customerId) {
        // Edit existing
        const index = customers.findIndex(c => c.id == customerId);
        if (index !== -1) {
            customers[index] = { ...customers[index], ...customerData };
        }
        showToast('Customer updated successfully', 'success');
    } else {
        // Add new
        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        customers.push({
            id: newId,
            ...customerData,
            created_at: new Date().toISOString()
        });
        showToast('Customer added successfully', 'success');
    }

    localStorage.setItem('hpgas_customers', JSON.stringify(customers));
    loadCustomers();
    closeCustomerModal();
}

function deleteCustomer(id, name) {
    if (!confirm(`Are you sure you want to delete customer "${name}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    // Check if customer has any deliveries
    const deliveries = getDeliveries();
    const customerDeliveries = deliveries.filter(d => d.customer_id === id);
    
    if (customerDeliveries.length > 0) {
        if (!confirm(`This customer has ${customerDeliveries.length} delivery record(s). Are you sure you want to proceed with deletion?`)) {
            return;
        }
    }

    let customers = getCustomers();
    customers = customers.filter(c => c.id !== id);
    localStorage.setItem('hpgas_customers', JSON.stringify(customers));
    
    showToast('Customer deleted successfully', 'success');
    loadCustomers();
}

function viewCustomerDetails(id) {
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return;

    const statusBadge = customer.status === 'active' 
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-secondary">Inactive</span>';

    // Get delivery history for this customer
    const deliveries = getDeliveries().filter(d => d.customer_id === id);
    const totalDeliveries = deliveries.length;
    const lastDelivery = deliveries.length > 0 
        ? new Date(deliveries[deliveries.length - 1].created_at).toLocaleDateString('en-IN')
        : 'No deliveries yet';

    let html = `
        <div class="space-y-6">
            <!-- Basic Info -->
            <div>
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-semibold text-gray-900">${customer.name}</h4>
                    ${statusBadge}
                </div>
                <div class="space-y-2">
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <div>
                            <p class="text-sm font-medium text-gray-900">Business Type</p>
                            <p class="text-sm text-gray-600">${customer.business_type}</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <div>
                            <p class="text-sm font-medium text-gray-900">Address</p>
                            <p class="text-sm text-gray-600">${customer.address}</p>
                            ${customer.city ? `<p class="text-sm text-gray-600">${customer.city}${customer.pincode ? ' - ' + customer.pincode : ''}</p>` : ''}
                        </div>
                    </div>
                    ${customer.latitude && customer.longitude ? `
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                            </svg>
                            <div>
                                <p class="text-sm font-medium text-gray-900">Coordinates</p>
                                <p class="text-sm text-gray-600">${customer.latitude}, ${customer.longitude}</p>
                                <a href="https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}" target="_blank" class="text-sm text-orange-600 hover:text-orange-700">View on Map →</a>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Primary Contact -->
            <div class="pt-6 border-t border-gray-200">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Primary Contact</h4>
                <div class="space-y-2">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span class="text-sm text-gray-900">${customer.primary_contact.name}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                        <a href="tel:${customer.primary_contact.phone}" class="text-sm text-orange-600 hover:text-orange-700">${customer.primary_contact.phone}</a>
                    </div>
                    ${customer.primary_contact.whatsapp ? `
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <a href="https://wa.me/${customer.primary_contact.whatsapp.replace(/\D/g, '')}" target="_blank" class="text-sm text-green-600 hover:text-green-700">${customer.primary_contact.whatsapp}</a>
                        </div>
                    ` : ''}
                    ${customer.primary_contact.email ? `
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <a href="mailto:${customer.primary_contact.email}" class="text-sm text-orange-600 hover:text-orange-700">${customer.primary_contact.email}</a>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Secondary Contact -->
            ${customer.secondary_contact && customer.secondary_contact.name ? `
                <div class="pt-6 border-t border-gray-200">
                    <h4 class="text-md font-semibold text-gray-900 mb-3">Secondary Contact</h4>
                    <div class="space-y-2">
                        <div class="flex items-center gap-3">
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span class="text-sm text-gray-900">${customer.secondary_contact.name}</span>
                        </div>
                        ${customer.secondary_contact.phone ? `
                            <div class="flex items-center gap-3">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                                <a href="tel:${customer.secondary_contact.phone}" class="text-sm text-orange-600 hover:text-orange-700">${customer.secondary_contact.phone}</a>
                            </div>
                        ` : ''}
                        ${customer.secondary_contact.whatsapp ? `
                            <div class="flex items-center gap-3">
                                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                <a href="https://wa.me/${customer.secondary_contact.whatsapp.replace(/\D/g, '')}" target="_blank" class="text-sm text-green-600 hover:text-green-700">${customer.secondary_contact.whatsapp}</a>
                            </div>
                        ` : ''}
                        ${customer.secondary_contact.email ? `
                            <div class="flex items-center gap-3">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                <a href="mailto:${customer.secondary_contact.email}" class="text-sm text-orange-600 hover:text-orange-700">${customer.secondary_contact.email}</a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Delivery History -->
            <div class="pt-6 border-t border-gray-200">
                <h4 class="text-md font-semibold text-gray-900 mb-3">Delivery History</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">Total Deliveries</p>
                        <p class="text-2xl font-bold text-gray-900">${totalDeliveries}</p>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-600 mb-1">Last Delivery</p>
                        <p class="text-sm font-semibold text-gray-900">${lastDelivery}</p>
                    </div>
                </div>
            </div>

            ${customer.notes ? `
                <div class="pt-6 border-t border-gray-200">
                    <h4 class="text-md font-semibold text-gray-900 mb-3">Notes</h4>
                    <p class="text-sm text-gray-600">${customer.notes}</p>
                </div>
            ` : ''}

            <!-- Actions -->
            <div class="pt-6 border-t border-gray-200">
                <div class="flex gap-3">
                    <button onclick="editCustomer(${customer.id}); closeCustomerDetailsModal();" class="flex-1 btn btn-primary">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit Customer
                    </button>
                    <button onclick="callCustomer('${customer.primary_contact.phone}')" class="btn btn-secondary">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    $('#customerDetailsContent').html(html);
    $('#customerDetailsModal').removeClass('hidden');
}

function closeCustomerDetailsModal() {
    $('#customerDetailsModal').addClass('hidden');
}

function callCustomer(phone) {
    window.location.href = `tel:${phone}`;
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', 'error');
        return;
    }

    showToast('Getting your location...', 'warning');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            $('#latitude').val(position.coords.latitude.toFixed(6));
            $('#longitude').val(position.coords.longitude.toFixed(6));
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