// Driver Make Delivery JavaScript

let currentCustomer = null;
let deliveredItems = [];
let emptyItems = [];
let returnItems = [];
let deliveryPhotos = [];
let payments = [];
let currentPhotoIndex = 0;
let deliveredItemCounter = 0;
let emptyItemCounter = 0;
let returnItemCounter = 0;
let paymentCounter = 0;

$(document).ready(function() {
    const user = checkAuth();
    if (!user || user.role !== 'driver') {
        logout();
        return;
    }

    // Get customer ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = parseInt(urlParams.get('customer'));
    
    if (!customerId) {
        showToast('Customer not found', 'error');
        setTimeout(() => {
            window.location.href = 'driver-deliveries.html';
        }, 1000);
        return;
    }
    
    loadCustomer(customerId);
    
    // Form submit
    $('#deliveryForm').submit(function(e) {
        e.preventDefault();
        submitDelivery();
    });
});

function loadCustomer(customerId) {
    const customers = getCustomers();
    currentCustomer = customers.find(c => c.id === customerId);
    
    if (!currentCustomer) {
        showToast('Customer not found', 'error');
        setTimeout(() => {
            window.location.href = 'driver-deliveries.html';
        }, 1000);
        return;
    }
    
    // Update UI
    $('#customerName').text(currentCustomer.name);
    $('#customerInfoName').text(currentCustomer.name);
    $('#customerBusinessType').text(currentCustomer.business_type);
    $('#customerAddress').text(currentCustomer.address);
}

function callCustomer() {
    if (currentCustomer && currentCustomer.phone) {
        window.location.href = `tel:${currentCustomer.phone}`;
    }
}

function whatsappCustomer() {
    if (currentCustomer && currentCustomer.whatsapp) {
        window.location.href = `https://wa.me/${currentCustomer.whatsapp.replace(/\D/g, '')}`;
    }
}

function navigateToCustomer() {
    if (currentCustomer) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${currentCustomer.latitude},${currentCustomer.longitude}`;
        window.open(url, '_blank');
    }
}

// ===== DELIVERED ITEMS =====
function addDeliveredItem() {
    deliveredItemCounter++;
    const id = deliveredItemCounter;
    
    const html = `
        <div class="delivered-item p-4 bg-gray-50 rounded-lg border border-gray-200" data-id="${id}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">Cylinder #${deliveredItemCounter}</h4>
                <button type="button" class="text-red-500 hover:text-red-600" onclick="removeDeliveredItem(${id})">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Provider *</label>
                    <select class="delivered-provider w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="HP">HP</option>
                        <option value="Indane">Indane</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Weight *</label>
                    <select class="delivered-kg w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="5">5 kg</option>
                        <option value="19">19 kg</option>
                        <option value="35">35 kg</option>
                        <option value="47.5">47.5 kg</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" class="delivered-quantity w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" min="1" placeholder="0" required>
                </div>
            </div>
        </div>
    `;
    
    $('#emptyDeliveredState').hide();
    $('#deliveredItemsContainer').append(html);
}

function removeDeliveredItem(id) {
    $(`.delivered-item[data-id="${id}"]`).fadeOut(300, function() {
        $(this).remove();
        if ($('.delivered-item').length === 0) {
            $('#emptyDeliveredState').show();
        }
    });
}

// ===== EMPTY ITEMS =====
function addEmptyItem() {
    emptyItemCounter++;
    const id = emptyItemCounter;
    
    const html = `
        <div class="empty-item p-4 bg-gray-50 rounded-lg border border-gray-200" data-id="${id}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">Empty #${emptyItemCounter}</h4>
                <button type="button" class="text-red-500 hover:text-red-600" onclick="removeEmptyItem(${id})">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            
            <div class="grid grid-cols-3 gap-2">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Provider *</label>
                    <select class="empty-provider w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="HP">HP</option>
                        <option value="Indane">Indane</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Weight *</label>
                    <select class="empty-kg w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="5">5 kg</option>
                        <option value="19">19 kg</option>
                        <option value="35">35 kg</option>
                        <option value="47.5">47.5 kg</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                    <input type="number" class="empty-quantity w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" min="1" placeholder="0" required>
                </div>
            </div>
        </div>
    `;
    
    $('#emptyCollectedState').hide();
    $('#emptyItemsContainer').append(html);
}

function removeEmptyItem(id) {
    $(`.empty-item[data-id="${id}"]`).fadeOut(300, function() {
        $(this).remove();
        if ($('.empty-item').length === 0) {
            $('#emptyCollectedState').show();
        }
    });
}

// ===== RETURN/DAMAGED ITEMS =====
function addReturnItem() {
    returnItemCounter++;
    const id = returnItemCounter;
    
    const html = `
        <div class="return-item p-4 bg-red-50 rounded-lg border border-red-200" data-id="${id}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">Return Cylinder #${returnItemCounter}</h4>
                <button type="button" class="text-red-500 hover:text-red-600" onclick="removeReturnItem(${id})">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Provider *</label>
                    <select class="return-provider w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="HP">HP</option>
                        <option value="Indane">Indane</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Weight *</label>
                    <select class="return-kg w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required>
                        <option value="">Select</option>
                        <option value="5">5 kg</option>
                        <option value="19">19 kg</option>
                        <option value="35">35 kg</option>
                        <option value="47.5">47.5 kg</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-2">Cylinder Photo * (Required - Use Camera)</label>
                <div class="return-photo-container">
                    <div class="photo-item w-full aspect-video" onclick="captureReturnPhoto(${id})">
                        <div class="text-center">
                            <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <p class="text-sm font-medium text-gray-700">Tap to Open Camera</p>
                            <p class="text-xs text-gray-500 mt-1">Capture photo of damaged cylinder</p>
                        </div>
                    </div>
                </div>
                <input type="file" class="return-photo-input" accept="image/*" capture="environment" style="display: none;" onchange="handleReturnPhoto(event, ${id})">
            </div>
        </div>
    `;
    
    $('#emptyReturnState').hide();
    $('#returnItemsContainer').append(html);
}

function removeReturnItem(id) {
    $(`.return-item[data-id="${id}"]`).fadeOut(300, function() {
        $(this).remove();
        if ($('.return-item').length === 0) {
            $('#emptyReturnState').show();
        }
    });
}

function captureReturnPhoto(id) {
    $(`.return-item[data-id="${id}"] .return-photo-input`).click();
}

function handleReturnPhoto(event, id) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result;
        
        // Update photo container
        const container = $(`.return-item[data-id="${id}"] .return-photo-container`);
        container.html(`
            <div class="relative">
                <img src="${photoData}" class="w-full h-48 object-cover rounded-lg">
                <button type="button" onclick="removeReturnPhoto(${id})" class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
        
        // Store photo data
        $(`.return-item[data-id="${id}"]`).data('photo', photoData);
    };
    reader.readAsDataURL(file);
}

function removeReturnPhoto(id) {
    const container = $(`.return-item[data-id="${id}"] .return-photo-container`);
    container.html(`
        <div class="photo-item w-full aspect-video" onclick="captureReturnPhoto(${id})">
            <div class="text-center">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p class="text-sm text-gray-500">Tap to capture photo</p>
            </div>
        </div>
    `);
    $(`.return-item[data-id="${id}"]`).removeData('photo');
}

// ===== DELIVERY PHOTOS =====
function captureDeliveryPhoto(index) {
    currentPhotoIndex = index;
    $('#deliveryPhotoInput').click();
}

function handleDeliveryPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result;
        deliveryPhotos[currentPhotoIndex] = photoData;
        
        // Update photo grid
        const photoItems = $('#deliveryPhotosGrid .photo-item');
        $(photoItems[currentPhotoIndex]).html(`
            <img src="${photoData}" class="w-full h-full object-cover">
            <button type="button" onclick="removeDeliveryPhoto(${currentPhotoIndex})" class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `).addClass('relative');
        
        // Show next photo slot if available
        if (currentPhotoIndex < 3) {
            $(photoItems[currentPhotoIndex + 1]).removeClass('hidden');
        }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
}

function removeDeliveryPhoto(index) {
    deliveryPhotos[index] = null;
    
    const photoItems = $('#deliveryPhotosGrid .photo-item');
    $(photoItems[index]).html(`
        <div class="text-center">
            <svg class="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <p class="text-xs text-gray-500">Add Photo</p>
        </div>
    `).removeClass('relative');
}

// ===== PAYMENTS =====
function addPayment() {
    paymentCounter++;
    const id = paymentCounter;
    
    const html = `
        <div class="payment-item p-4 bg-green-50 rounded-lg border border-green-200" data-id="${id}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">Payment #${paymentCounter}</h4>
                <button type="button" class="text-red-500 hover:text-red-600" onclick="removePayment(${id})">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Payment Mode *</label>
                    <select class="payment-mode w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" onchange="togglePaymentReference(${id})" required>
                        <option value="">Select</option>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
                    <input type="number" class="payment-amount w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" min="0" placeholder="0" onchange="updateTotalPayment()" required>
                </div>
            </div>
            
            <div class="payment-reference-field hidden">
                <label class="block text-xs font-medium text-gray-700 mb-1">Reference / Transaction ID *</label>
                <input type="text" class="payment-reference w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 mb-3" placeholder="Enter reference number">
                
                <label class="block text-xs font-medium text-gray-700 mb-2">Payment Proof Photo * (Use Camera)</label>
                <div class="payment-photo-container">
                    <div class="photo-item w-full aspect-video" onclick="capturePaymentPhoto(${id})">
                        <div class="text-center">
                            <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <p class="text-sm font-medium text-gray-700">Tap to Open Camera</p>
                            <p class="text-xs text-gray-500 mt-1">Capture screenshot/receipt</p>
                        </div>
                    </div>
                </div>
                <input type="file" class="payment-photo-input" accept="image/*" capture="environment" style="display: none;" onchange="handlePaymentPhoto(event, ${id})">
            </div>
        </div>
    `;
    
    $('#emptyPaymentState').hide();
    $('#paymentsContainer').append(html);
    updateTotalPayment();
}

function removePayment(id) {
    $(`.payment-item[data-id="${id}"]`).fadeOut(300, function() {
        $(this).remove();
        if ($('.payment-item').length === 0) {
            $('#emptyPaymentState').show();
            $('#totalPaymentSection').addClass('hidden');
        }
        updateTotalPayment();
    });
}

function togglePaymentReference(id) {
    const mode = $(`.payment-item[data-id="${id}"] .payment-mode`).val();
    const refField = $(`.payment-item[data-id="${id}"] .payment-reference-field`);
    
    if (mode === 'upi' || mode === 'cheque') {
        refField.removeClass('hidden');
        refField.find('.payment-reference').prop('required', true);
    } else {
        refField.addClass('hidden');
        refField.find('.payment-reference').prop('required', false);
    }
}

function capturePaymentPhoto(id) {
    $(`.payment-item[data-id="${id}"] .payment-photo-input`).click();
}

function handlePaymentPhoto(event, id) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result;
        
        // Update photo container
        const container = $(`.payment-item[data-id="${id}"] .payment-photo-container`);
        container.html(`
            <div class="relative">
                <img src="${photoData}" class="w-full h-48 object-cover rounded-lg">
                <button type="button" onclick="removePaymentPhoto(${id})" class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
        
        // Store photo data
        $(`.payment-item[data-id="${id}"]`).data('photo', photoData);
    };
    reader.readAsDataURL(file);
}

function removePaymentPhoto(id) {
    const container = $(`.payment-item[data-id="${id}"] .payment-photo-container`);
    container.html(`
        <div class="photo-item w-full aspect-video" onclick="capturePaymentPhoto(${id})">
            <div class="text-center">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p class="text-sm font-medium text-gray-700">Tap to Open Camera</p>
                <p class="text-xs text-gray-500 mt-1">Capture screenshot/receipt</p>
            </div>
        </div>
    `);
    $(`.payment-item[data-id="${id}"]`).removeData('photo');
}

function updateTotalPayment() {
    let total = 0;
    $('.payment-amount').each(function() {
        const amount = parseFloat($(this).val()) || 0;
        total += amount;
    });
    
    $('#totalPaymentAmount').text(total.toLocaleString('en-IN'));
    
    if ($('.payment-item').length > 0) {
        $('#totalPaymentSection').removeClass('hidden');
    }
}

// ===== SUBMIT DELIVERY =====
function submitDelivery() {
    // Validate delivered items
    deliveredItems = [];
    let deliveredValid = true;
    
    $('.delivered-item').each(function() {
        const provider = $(this).find('.delivered-provider').val();
        const kg = $(this).find('.delivered-kg').val();
        const quantity = parseInt($(this).find('.delivered-quantity').val());
        
        if (!provider || !kg || !quantity) {
            deliveredValid = false;
            return false;
        }
        
        deliveredItems.push({ provider, kg, quantity });
    });
    
    if (deliveredItems.length === 0) {
        showToast('Please add at least one delivered cylinder', 'error');
        return;
    }
    
    if (!deliveredValid) {
        showToast('Please fill all delivered cylinder fields', 'error');
        return;
    }
    
    // Validate delivery photos - at least 1 required
    const validPhotos = deliveryPhotos.filter(p => p != null);
    if (validPhotos.length === 0) {
        showToast('Please capture at least one delivery photo', 'error');
        return;
    }
    
    // Collect empty items
    emptyItems = [];
    $('.empty-item').each(function() {
        const provider = $(this).find('.empty-provider').val();
        const kg = $(this).find('.empty-kg').val();
        const quantity = parseInt($(this).find('.empty-quantity').val());
        
        if (provider && kg && quantity) {
            emptyItems.push({ provider, kg, quantity });
        }
    });
    
    // Collect return items - validate photos
    returnItems = [];
    let returnValid = true;
    
    $('.return-item').each(function() {
        const provider = $(this).find('.return-provider').val();
        const kg = $(this).find('.return-kg').val();
        const photo = $(this).data('photo');
        
        if (!provider || !kg) {
            returnValid = false;
            return false;
        }
        
        if (!photo) {
            showToast('Please capture photo for all return cylinders using camera', 'error');
            returnValid = false;
            return false;
        }
        
        returnItems.push({ provider, kg, photo });
    });
    
    if (!returnValid) {
        return;
    }
    
    // Collect payments - validate photos for UPI/Cheque
    payments = [];
    let paymentValid = true;
    
    $('.payment-item').each(function() {
        const mode = $(this).find('.payment-mode').val();
        const amount = parseFloat($(this).find('.payment-amount').val());
        const reference = $(this).find('.payment-reference').val();
        const photo = $(this).data('photo');
        
        if (!mode || !amount) {
            paymentValid = false;
            return false;
        }
        
        if ((mode === 'upi' || mode === 'cheque') && !reference) {
            showToast('Please enter reference for UPI/Cheque payments', 'error');
            paymentValid = false;
            return false;
        }
        
        if ((mode === 'upi' || mode === 'cheque') && !photo) {
            showToast('Please capture payment proof photo for UPI/Cheque using camera', 'error');
            paymentValid = false;
            return false;
        }
        
        payments.push({ 
            mode, 
            amount, 
            reference: reference || null,
            photo: photo || null 
        });
    });
    
    if (payments.length === 0) {
        showToast('Please add at least one payment', 'error');
        return;
    }
    
    if (!paymentValid) {
        return;
    }
    
    // Get location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                completeDelivery(position.coords.latitude, position.coords.longitude);
            },
            function(error) {
                // If location fails, still complete delivery
                completeDelivery(null, null);
            }
        );
    } else {
        completeDelivery(null, null);
    }
}

function completeDelivery(latitude, longitude) {
    const user = getCurrentUser();
    const trips = getTrips();
    const activeTrip = trips.find(t => t.driver_id === user.id && t.status === 'ongoing');
    
    if (!activeTrip) {
        showToast('No active trip found', 'error');
        return;
    }
    
    // Get filtered photos (non-null)
    const validPhotos = deliveryPhotos.filter(p => p != null);
    
    // Create delivery object
    const deliveries = getDeliveries();
    const newId = deliveries.length > 0 ? Math.max(...deliveries.map(d => d.id)) + 1 : 1;
    
    const delivery = {
        id: newId,
        trip_id: activeTrip.id,
        customer_id: currentCustomer.id,
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time: new Date().toISOString().split('T')[1].split('.')[0],
        delivered_items: deliveredItems,
        empty_collected: emptyItems,
        return_collected: returnItems,
        payments: payments,
        photos: validPhotos,
        notes: $('#deliveryNotes').val(),
        latitude: latitude,
        longitude: longitude,
        created_at: new Date().toISOString()
    };
    
    deliveries.push(delivery);
    saveDeliveries(deliveries);
    
    showToast('Delivery completed successfully!', 'success');
    
    setTimeout(() => {
        window.location.href = 'driver-trip.html';
    }, 1500);
}