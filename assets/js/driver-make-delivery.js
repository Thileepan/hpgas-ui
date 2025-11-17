// Driver Make Delivery JavaScript - Optimized for Storage
// UPDATED: Now using Supabase with async/await instead of localStorage

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

$(document).ready(async function() {  // ← Made async
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
    
    await loadCustomer(customerId);  // ← Added await
    
    // Form submit
    $('#deliveryForm').submit(async function(e) {  // ← Made async
        e.preventDefault();
        await submitDelivery();  // ← Added await
    });
});

// ===== IMAGE COMPRESSION UTILITY =====
function compressImage(dataURL, maxWidth = 800, quality = 0.6) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG with quality setting
            const compressedDataURL = canvas.toDataURL('image/jpeg', quality);
            
            console.log(`Original size: ${(dataURL.length / 1024).toFixed(2)} KB`);
            console.log(`Compressed size: ${(compressedDataURL.length / 1024).toFixed(2)} KB`);
            console.log(`Compression ratio: ${((1 - compressedDataURL.length / dataURL.length) * 100).toFixed(1)}%`);
            
            resolve(compressedDataURL);
        };
        img.src = dataURL;
    });
}

async function loadCustomer(customerId) {  // ← Made async
    // UPDATED: Made data fetching async
    const customers = await getCustomers();  // ← Added await
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

// ===== DELIVERY PHOTOS =====
function captureDeliveryPhoto(index) {
    currentPhotoIndex = index;
    $('#deliveryPhotoInput').click();
}

async function handleDeliveryPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const originalDataURL = e.target.result;
        
        // Compress the image
        const compressedDataURL = await compressImage(originalDataURL);
        
        // Store compressed photo
        deliveryPhotos[currentPhotoIndex] = compressedDataURL;
        
        // Update UI
        const photoItems = $('#deliveryPhotosGrid .photo-item');
        const photoItem = photoItems.eq(currentPhotoIndex);
        
        photoItem.html(`
            <img src="${compressedDataURL}" alt="Delivery Photo" class="w-full h-full object-cover rounded-lg">
            <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 z-10" onclick="removeDeliveryPhoto(${currentPhotoIndex})">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `).addClass('relative');
        
        // Show next photo slot if available
        if (currentPhotoIndex < 3) {
            photoItems.eq(currentPhotoIndex + 1).removeClass('hidden');
        }
        
        showToast('Photo captured successfully', 'success');
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
}

function removeDeliveryPhoto(index) {
    deliveryPhotos[index] = null;
    
    const photoItems = $('#deliveryPhotosGrid .photo-item');
    const photoItem = photoItems.eq(index);
    
    photoItem.html(`
        <div class="text-center">
            <svg class="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <p class="text-xs text-gray-500">Tap to Capture</p>
        </div>
    `).removeClass('relative').attr('onclick', `captureDeliveryPhoto(${index})`);
    
    showToast('Photo removed', 'info');
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
                    <select class="return-provider w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" required>
                        <option value="">Select</option>
                        <option value="HP">HP</option>
                        <option value="Indane">Indane</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Weight *</label>
                    <select class="return-kg w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500" required>
                        <option value="">Select</option>
                        <option value="5">5 kg</option>
                        <option value="19">19 kg</option>
                        <option value="35">35 kg</option>
                        <option value="47.5">47.5 kg</option>
                    </select>
                </div>
            </div>
            
            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Photo Required *</label>
                <div class="return-photo-container">
                    <div class="photo-item w-full aspect-video" onclick="captureReturnPhoto(${id})">
                        <div class="text-center">
                            <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <p class="text-sm font-medium text-gray-700">Tap to Open Camera</p>
                            <p class="text-xs text-gray-500 mt-1">Photo required for damaged/return</p>
                        </div>
                    </div>
                </div>
                <input type="file" id="returnPhoto-${id}" accept="image/*" capture="environment" style="display: none;" onchange="handleReturnPhoto(event, ${id})">
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
    console.log('Opening camera for return photo', id);
    $(`#returnPhoto-${id}`).click();
}

async function handleReturnPhoto(event, id) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const originalData = e.target.result;
        
        // Compress the image
        const compressedData = await compressImage(originalData, 600, 0.5);
        
        const container = $(`.return-item[data-id="${id}"] .return-photo-container`);
        container.html(`
            <div class="relative">
                <img src="${compressedData}" class="w-full h-48 object-cover rounded-lg">
                <button type="button" class="remove-return-photo-btn absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600" data-id="${id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
        
        // Attach remove handler
        container.find('.remove-return-photo-btn').on('click', function() {
            removeReturnPhoto($(this).data('id'));
        });
        
        // Store compressed photo data
        $(`.return-item[data-id="${id}"]`).data('photo', compressedData);
    };
    reader.readAsDataURL(file);
}

function removeReturnPhoto(id) {
    const container = $(`.return-item[data-id="${id}"] .return-photo-container`);
    container.html(`
        <div class="photo-item w-full aspect-video cursor-pointer">
            <div class="text-center">
                <svg class="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p class="text-sm font-medium text-gray-700">Tap to Open Camera</p>
                <p class="text-xs text-gray-500 mt-1">Photo required for damaged/return</p>
            </div>
        </div>
    `);
    
    // Attach click handler
    container.find('.photo-item').on('click', function() {
        captureReturnPhoto(id);
    });
    
    $(`.return-item[data-id="${id}"]`).removeData('photo');
}


// ===== PAYMENTS =====
function addPayment() {
    paymentCounter++;
    const id = paymentCounter;
    
    const html = `
        <div class="payment-item p-4 bg-gray-50 rounded-lg border border-gray-200" data-id="${id}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">Payment #${paymentCounter}</h4>
                <button type="button" class="text-red-500 hover:text-red-600" onclick="removePayment(${id})">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Payment Mode *</label>
                    <select class="payment-mode w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" onchange="handlePaymentModeChange(${id})" required>
                        <option value="">Select Mode</option>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="cheque">Cheque</option>
                        <option value="credit">Credit</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                    <input type="number" class="payment-amount w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" min="0" step="0.01" placeholder="0.00" onchange="updateTotalPayment()" required>
                </div>
                
                <div class="payment-reference-container hidden">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Reference/Transaction ID *</label>
                    <input type="text" class="payment-reference w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="Enter reference number">
                </div>
                
                <div class="payment-photo-section hidden">
                    <label class="block text-xs font-medium text-gray-700 mb-1">Payment Proof (Screenshot/Photo) *</label>
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
                    <input type="file" id="paymentPhoto-${id}" accept="image/*" capture="environment" style="display: none;" onchange="handlePaymentPhoto(event, ${id})">
                </div>
            </div>
        </div>
    `;
    
    $('#emptyPaymentState').hide();
    $('#paymentsContainer').append(html);
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

function handlePaymentModeChange(id) {
    const mode = $(`.payment-item[data-id="${id}"] .payment-mode`).val();
    const $item = $(`.payment-item[data-id="${id}"]`);
    
    if (mode === 'upi' || mode === 'cheque') {
        $item.find('.payment-reference-container').removeClass('hidden');
        $item.find('.payment-reference').prop('required', true);
        $item.find('.payment-photo-section').removeClass('hidden');
    } else {
        $item.find('.payment-reference-container').addClass('hidden');
        $item.find('.payment-reference').prop('required', false);
        $item.find('.payment-photo-section').addClass('hidden');
        $item.removeData('photo');
    }
}

function capturePaymentPhoto(id) {
    console.log('Opening camera for payment photo', id);
    $(`#paymentPhoto-${id}`).click();
}

async function handlePaymentPhoto(event, id) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const originalData = e.target.result;
        
        // Compress the image
        const compressedData = await compressImage(originalData, 600, 0.5);
        
        const container = $(`.payment-item[data-id="${id}"] .payment-photo-container`);
        container.html(`
            <div class="relative">
                <img src="${compressedData}" class="w-full h-48 object-cover rounded-lg">
                <button type="button" class="remove-payment-photo-btn absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600" data-id="${id}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
        
        // Attach remove handler
        container.find('.remove-payment-photo-btn').on('click', function() {
            removePaymentPhoto($(this).data('id'));
        });
        
        // Store compressed photo data
        $(`.payment-item[data-id="${id}"]`).data('photo', compressedData);
    };
    reader.readAsDataURL(file);
}

function removePaymentPhoto(id) {
    const container = $(`.payment-item[data-id="${id}"] .payment-photo-container`);
    container.html(`
        <div class="photo-item w-full aspect-video cursor-pointer">
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
    
    // Attach click handler
    container.find('.photo-item').on('click', function() {
        capturePaymentPhoto(id);
    });
    
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
async function submitDelivery() {  // ← Made async
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
    
    // ===== VALIDATE AGAINST TRIP LOAD =====
    const user = getCurrentUser();
    const trips = await getTrips();
    const activeTrip = trips
        .filter(t => t.driver_id === user.id && t.status === 'ongoing')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    if (!activeTrip) {
        showToast('No active trip found', 'error');
        return;
    }
    
    // Get all deliveries already made in this trip
    const deliveries = await getDeliveries();
    const tripDeliveries = deliveries.filter(d => d.trip_id === activeTrip.id);
    
    // Calculate total delivered so far per cylinder type
    const alreadyDelivered = {};
    tripDeliveries.forEach(delivery => {
        delivery.delivered_items.forEach(item => {
            const key = `${item.provider}_${item.kg}`;
            if (!alreadyDelivered[key]) {
                alreadyDelivered[key] = 0;
            }
            alreadyDelivered[key] += item.quantity;
        });
    });
    
    // Check if current delivery exceeds trip load
    let exceedsLoad = false;
    let exceedDetails = [];
    
    deliveredItems.forEach(item => {
        const key = `${item.provider}_${item.kg}`;
        
        // Find matching load item
        const loadItem = activeTrip.load_details.find(
            l => l.provider === item.provider && 
                 parseFloat(l.kg) === parseFloat(item.kg) && 
                 l.type === 'filled'
        );
        
        if (!loadItem) {
            exceedsLoad = true;
            exceedDetails.push(
                `${item.provider} ${item.kg}kg: Not loaded on this trip`
            );
            return;
        }
        
        // Calculate available for delivery
        const loaded = loadItem.quantity;
        const previouslyDelivered = alreadyDelivered[key] || 0;
        const available = loaded - previouslyDelivered;
        
        if (item.quantity > available) {
            exceedsLoad = true;
            exceedDetails.push(
                `${item.provider} ${item.kg}kg: Trying to deliver ${item.quantity}, but only ${available} available (Loaded: ${loaded}, Already delivered: ${previouslyDelivered})`
            );
        }
    });
    
    if (exceedsLoad) {
        showToast('Cannot deliver more than loaded on vehicle!', 'error');
        
        // Show detailed error
        let errorMsg = '<div class="text-left"><p class="font-semibold mb-2 text-red-600">Delivery Exceeds Trip Load:</p><ul class="list-disc pl-5 space-y-1">';
        exceedDetails.forEach(detail => {
            errorMsg += `<li class="text-sm">${detail}</li>`;
        });
        errorMsg += '</ul></div>';
        
        $('#exceedsLoadDetails').html(errorMsg);
        $('#exceedsLoadModal').removeClass('hidden');
        
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

async function completeDelivery(latitude, longitude) {  // ← Made async
    const user = getCurrentUser();
    // UPDATED: Made all data fetching async
    const trips = await getTrips();  // ← Added await
    const activeTrip = trips
        .filter(t => t.driver_id === user.id && t.status === 'ongoing')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    if (!activeTrip) {
        showToast('No active trip found', 'error');
        return;
    }
    
    // Get filtered photos (non-null) - already compressed
    const validPhotos = deliveryPhotos.filter(p => p != null);
    
    console.log('Saving delivery with compressed photos');
    console.log('Number of photos:', validPhotos.length);
    console.log('Total estimated size:', (JSON.stringify(validPhotos).length / 1024).toFixed(2), 'KB');
    
    // Create delivery object
    const deliveries = await getDeliveries();  // ← Added await
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
        photos: validPhotos, // Compressed photos
        notes: $('#deliveryNotes').val(),
        latitude: latitude,
        longitude: longitude,
        created_at: new Date().toISOString()
    };
    
    try {
        deliveries.push(delivery);
        await saveDeliveries(deliveries);  // ← Added await
        
        // ===== UPDATE INVENTORY =====
        await updateInventoryAfterDelivery(activeTrip.godown_id, deliveredItems, emptyItems);
        
        console.log('Delivery saved successfully');
        console.log('Total deliveries in storage:', deliveries.length);
        
        showToast('Delivery completed successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'driver-trip.html';
        }, 1500);
    } catch (error) {
        console.error('Error saving delivery:', error);
        if (error.name === 'QuotaExceededError') {
            showToast('Storage limit exceeded. Please contact support.', 'error');
            // Optionally: try to save without photos
            console.log('Attempting to save without photos...');
            delivery.photos = [];
            delivery.return_collected = delivery.return_collected.map(r => ({...r, photo: null}));
            delivery.payments = delivery.payments.map(p => ({...p, photo: null}));
            try {
                deliveries.push(delivery);
                await saveDeliveries(deliveries);  // ← Added await
                
                // Still update inventory even without photos
                await updateInventoryAfterDelivery(activeTrip.godown_id, deliveredItems, emptyItems);
                
                showToast('Delivery saved without photos due to storage limits', 'warning');
                setTimeout(() => {
                    window.location.href = 'driver-trip.html';
                }, 2000);
            } catch (e2) {
                showToast('Unable to save delivery. Please try again.', 'error');
            }
        } else {
            showToast('Error saving delivery. Please try again.', 'error');
        }
    }
}

// ===== UPDATE INVENTORY AFTER DELIVERY =====
async function updateInventoryAfterDelivery(godownId, deliveredItems, emptyItems) {
    try {
        console.log('Updating inventory after delivery...');
        
        const inventory = await getInventory();  // ← Get current inventory
        
        // Process delivered items - cylinders now with customer
        // NOTE: Filled stock was already reduced when trip started
        // Here we just track that cylinders are now with customer (keep in_transit)
        deliveredItems.forEach(item => {
            const inventoryItem = inventory.find(
                inv => inv.godown_id === godownId && 
                       inv.provider === item.provider && 
                       inv.kg === parseFloat(item.kg)
            );
            
            if (inventoryItem) {
                // Cylinders already in in_transit from trip start
                // They stay in_transit until customer returns them as empty
                console.log(`Delivered ${item.provider} ${item.kg}kg: ${item.quantity} (staying in_transit)`);
            } else {
                console.warn(`Inventory item not found: ${item.provider} ${item.kg}kg`);
            }
        });
        
        // Process empty collected items (reduce in_transit, increase empty stock)
        emptyItems.forEach(item => {
            const inventoryItem = inventory.find(
                inv => inv.godown_id === godownId && 
                       inv.provider === item.provider && 
                       inv.kg === parseFloat(item.kg)
            );
            
            if (inventoryItem) {
                // Reduce in_transit (customer returned empties)
                inventoryItem.in_transit = Math.max(0, inventoryItem.in_transit - item.quantity);
                // Increase empty stock (empties back in godown)
                inventoryItem.empty += item.quantity;
                console.log(`Collected ${item.provider} ${item.kg}kg: -${item.quantity} in_transit, +${item.quantity} empty`);
            } else {
                console.warn(`Inventory item not found: ${item.provider} ${item.kg}kg`);
            }
        });
        
        // Save updated inventory
        await saveInventory(inventory);
        console.log('Inventory updated successfully');
        
    } catch (error) {
        console.error('Error updating inventory:', error);
        // Don't fail the delivery if inventory update fails
        // The manager can manually adjust inventory later
    }
}

// Close exceeds load modal
function closeExceedsLoadModal() {
    $('#exceedsLoadModal').addClass('hidden');
}