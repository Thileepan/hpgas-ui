// Driver History JavaScript

let allDeliveries = [];
let filteredDeliveries = [];

$(document).ready(async function() {  // ← Made async
    const user = checkAuth();
    if (!user || user.role !== 'driver') {
        logout();
        return;
    }

    // Set default date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    $('#fromDate').val(formatDate(firstDayOfMonth));
    $('#toDate').val(formatDate(today));
    
    await loadDeliveries();  // ← Added await
    
    // Filter buttons
    $('.filter-btn').click(function() {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        
        const period = $(this).data('period');
        applyPeriodFilter(period);
    });
});

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadDeliveries() {  // ← Made async
    const user = getCurrentUser();
    const trips = await getTrips();  // ← Added await
    const deliveries = await getDeliveries();  // ← Added await
    
    // Get all deliveries from trips where this user was the driver
    const userTrips = trips.filter(t => t.driver_id === user.id);
    const tripIds = userTrips.map(t => t.id);
    
    allDeliveries = deliveries.filter(d => tripIds.includes(d.trip_id));
    
    // Calculate stats
    calculateStats();
    
    // Apply default filter (all)
    applyPeriodFilter('all');
}

function calculateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = allDeliveries.filter(d => d.delivery_date === today);
    $('#todayDeliveries').text(todayDeliveries.length);
    
    // This week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekStr = formatDate(startOfWeek);
    
    const weekDeliveries = allDeliveries.filter(d => d.delivery_date >= startOfWeekStr);
    $('#weekDeliveries').text(weekDeliveries.length);
    
    $('#totalDeliveries').text(allDeliveries.length);
}

function applyPeriodFilter(period) {
    const today = new Date();
    let fromDate, toDate;
    
    switch(period) {
        case 'today':
            fromDate = toDate = formatDate(today);
            break;
        case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            fromDate = formatDate(startOfWeek);
            toDate = formatDate(today);
            break;
        case 'month':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            fromDate = formatDate(startOfMonth);
            toDate = formatDate(today);
            break;
        case 'all':
        default:
            fromDate = null;
            toDate = null;
            break;
    }
    
    if (fromDate && toDate) {
        $('#fromDate').val(fromDate);
        $('#toDate').val(toDate);
    }
    
    filterDeliveries(fromDate, toDate);
}

function applyDateFilter() {
    const fromDate = $('#fromDate').val();
    const toDate = $('#toDate').val();
    
    if (!fromDate || !toDate) {
        showToast('Please select both from and to dates', 'error');
        return;
    }
    
    if (fromDate > toDate) {
        showToast('From date cannot be after to date', 'error');
        return;
    }
    
    $('.filter-btn').removeClass('active');
    filterDeliveries(fromDate, toDate);
}

function filterDeliveries(fromDate, toDate) {
    if (!fromDate || !toDate) {
        filteredDeliveries = [...allDeliveries];
    } else {
        filteredDeliveries = allDeliveries.filter(d => {
            return d.delivery_date >= fromDate && d.delivery_date <= toDate;
        });
    }
    
    // Sort by date (newest first)
    filteredDeliveries.sort((a, b) => {
        const dateA = new Date(a.delivery_date + ' ' + a.delivery_time);
        const dateB = new Date(b.delivery_date + ' ' + b.delivery_time);
        return dateB - dateA;
    });
    
    displayDeliveries();
}

async function displayDeliveries() {  // ← Made async
    if (filteredDeliveries.length === 0) {
        $('#deliveriesList').addClass('hidden');
        $('#emptyState').removeClass('hidden');
        return;
    }
    
    $('#emptyState').addClass('hidden');
    $('#deliveriesList').removeClass('hidden');
    
    const customers = await getCustomers();  // ← Added await
    let html = '';
    let currentDate = null;
    
    filteredDeliveries.forEach((delivery, index) => {
        const deliveryDate = delivery.delivery_date;
        
        // Add date header if new date
        if (deliveryDate !== currentDate) {
            currentDate = deliveryDate;
            const dateObj = new Date(deliveryDate);
            const dateStr = dateObj.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            html += `
                <div class="mt-6 mb-3">
                    <h3 class="font-bold text-gray-900">${dateStr}</h3>
                </div>
            `;
        }
        
        const customer = customers.find(c => c.id === delivery.customer_id);
        const time = new Date(delivery.delivery_date + ' ' + delivery.delivery_time).toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Calculate totals
        let totalQty = 0;
        delivery.delivered_items.forEach(item => totalQty += item.quantity);
        
        let totalPayment = 0;
        if (delivery.payments) {
            delivery.payments.forEach(p => totalPayment += p.amount);
        }
        
        html += `
            <div class="card cursor-pointer hover:shadow-lg transition-all animate-slide-up" 
                 style="animation-delay: ${(index % 10) * 0.05}s"
                 onclick="viewDeliveryDetail(${delivery.id})">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div class="flex-1">
                            <h3 class="font-bold text-gray-900">${customer ? customer.name : 'Unknown'}</h3>
                            <p class="text-sm text-gray-600">${customer ? customer.business_type : ''}</p>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-xs text-gray-500">${time}</span>
                                <span class="text-xs text-gray-400">•</span>
                                <span class="text-xs text-gray-500">${totalQty} cylinders</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-lg font-bold text-green-600">₹${totalPayment.toLocaleString('en-IN')}</span>
                        <p class="text-xs text-gray-500 mt-1">${delivery.payments.length} payment(s)</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-2 pt-3 border-t border-gray-200">
                    ${delivery.photos && delivery.photos.length > 0 ? `
                        <div class="flex items-center gap-1 text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="text-xs">${delivery.photos.length}</span>
                        </div>
                    ` : ''}
                    
                    ${delivery.empty_collected && delivery.empty_collected.length > 0 ? `
                        <div class="flex items-center gap-1 text-gray-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            <span class="text-xs">${delivery.empty_collected.reduce((sum, item) => sum + item.quantity, 0)} empty</span>
                        </div>
                    ` : ''}
                    
                    ${delivery.return_collected && delivery.return_collected.length > 0 ? `
                        <div class="flex items-center gap-1 text-red-500">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                            </svg>
                            <span class="text-xs">${delivery.return_collected.length} return</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    $('#deliveriesList').html(html);
}

async function viewDeliveryDetail(deliveryId) {  // ← Made async
    const delivery = allDeliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    const customers = await getCustomers();  // ← Added await
    const customer = customers.find(c => c.id === delivery.customer_id);
    
    const time = new Date(delivery.delivery_date + ' ' + delivery.delivery_time).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let html = `
        <div class="space-y-4">
            <!-- Customer Info -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-2">Customer</h4>
                <div class="p-3 bg-gray-50 rounded-lg">
                    <p class="font-semibold text-gray-900">${customer ? customer.name : 'Unknown'}</p>
                    <p class="text-sm text-gray-600">${customer ? customer.business_type : ''}</p>
                    <p class="text-sm text-gray-500 mt-1">${customer ? customer.address : ''}</p>
                </div>
            </div>
            
            <!-- Delivery Time -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-2">Delivery Time</h4>
                <p class="text-gray-700">${new Date(delivery.delivery_date).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })} at ${time}</p>
            </div>
            
            <!-- Delivered Items -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-2">Cylinders Delivered</h4>
                <div class="space-y-2">
                    ${delivery.delivered_items.map(item => `
                        <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span class="font-medium text-gray-900">${item.provider} ${item.kg}kg</span>
                            <span class="font-bold text-gray-900">${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Empty Collected -->
            ${delivery.empty_collected && delivery.empty_collected.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Empty Cylinders Collected</h4>
                    <div class="space-y-2">
                        ${delivery.empty_collected.map(item => `
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span class="font-medium text-gray-900">${item.provider} ${item.kg}kg</span>
                                <span class="font-bold text-gray-900">${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Return Collected -->
            ${delivery.return_collected && delivery.return_collected.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Return/Damaged Cylinders</h4>
                    <div class="space-y-2">
                        ${delivery.return_collected.map(item => `
                            <div class="p-3 bg-red-50 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium text-gray-900">${item.provider} ${item.kg}kg</span>
                                </div>
                                ${item.photo ? `<img src="${item.photo}" class="w-full h-32 object-cover rounded-lg cursor-pointer" onclick="viewPhoto('${item.photo}')">` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Payments -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-2">Payments</h4>
                <div class="space-y-2">
                    ${delivery.payments.map(payment => `
                        <div class="p-3 bg-green-50 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <div>
                                    <p class="font-medium text-gray-900">${payment.mode.toUpperCase()}</p>
                                    ${payment.reference ? `<p class="text-xs text-gray-600 mt-1">Ref: ${payment.reference}</p>` : ''}
                                </div>
                                <span class="text-lg font-bold text-green-600">₹${payment.amount.toLocaleString('en-IN')}</span>
                            </div>
                            ${payment.photo ? `
                                <div class="mt-2">
                                    <p class="text-xs text-gray-600 mb-1">Payment Proof:</p>
                                    <img src="${payment.photo}" class="w-full h-32 object-cover rounded-lg cursor-pointer" onclick="viewPhoto('${payment.photo}')">
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span class="font-semibold text-gray-900">Total:</span>
                    <span class="text-2xl font-bold text-green-600">₹${delivery.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}</span>
                </div>
            </div>
            
            <!-- Photos -->
            ${delivery.photos && delivery.photos.length > 0 ? `
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Delivery Photos</h4>
                    <div class="grid grid-cols-2 gap-2">
                        ${delivery.photos.map(photo => `
                            <img src="${photo}" class="w-full h-32 object-cover rounded-lg cursor-pointer" onclick="viewPhoto('${photo}')">
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Notes -->
            ${delivery.notes ? `
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p class="text-gray-700 p-3 bg-gray-50 rounded-lg">${delivery.notes}</p>
                </div>
            ` : ''}
            
            <!-- Location -->
            ${delivery.latitude && delivery.longitude ? `
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Delivery Location</h4>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600">${delivery.latitude.toFixed(6)}, ${delivery.longitude.toFixed(6)}</span>
                        <button onclick="window.open('https://www.google.com/maps?q=${delivery.latitude},${delivery.longitude}', '_blank')" class="btn btn-secondary btn-sm">
                            View on Map
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    $('#deliveryDetailContent').html(html);
    $('#deliveryDetailModal').removeClass('hidden');
}

function closeDeliveryDetail() {
    $('#deliveryDetailModal').addClass('hidden');
}

function viewPhoto(photoSrc) {
    window.open(photoSrc, '_blank');
}