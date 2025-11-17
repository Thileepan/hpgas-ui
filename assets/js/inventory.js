// Inventory Dashboard JavaScript
// UPDATED: Now using Supabase instead of localStorage

let currentProviderFilter = 'all';
const LOW_STOCK_THRESHOLD = 20; // Alert when filled stock below this number

$(document).ready(async function() {  // ← Made async
    const user = checkAuth();
    if (!user || user.role !== 'manager') {
        logout();
        return;
    }

    // Update user info
    $('#userName').text(user.name);
    const initials = user.name.split(' ').map(n => n[0]).join('');
    $('#userInitials').text(initials);

    // Get godown info - UPDATED: Made async
    const godowns = await getGodowns();
    const godown = godowns.find(g => g.id === user.godown_id);
    if (godown) {
        $('#godownName').text(godown.name);
        $('#mobileGodownName').text(godown.name);
    }

    // Load inventory
    await loadInventory();

    // Provider filter handlers
    $('.provider-filter-btn').click(async function() {  // ← Made async
        $('.provider-filter-btn').removeClass('active');
        $(this).addClass('active');
        currentProviderFilter = $(this).data('provider');
        await loadInventory();  // ← Added await
    });

    // Adjustment form handler - UPDATED: Made async
    $('#adjustmentForm').submit(async function(e) {  // ← Made async
        e.preventDefault();
        await adjustStock();  // ← Added await
    });
});

async function loadInventory() {  // ← Made async
    const user = getCurrentUser();
    let inventory = (await getInventory()).filter(i => i.godown_id === user.godown_id);  // ← Added await

    // Apply provider filter
    if (currentProviderFilter !== 'all') {
        inventory = inventory.filter(i => i.provider === currentProviderFilter);
    }

    // Calculate totals
    calculateTotals(inventory);

    // Group by provider
    const providers = {};
    inventory.forEach(item => {
        if (!providers[item.provider]) {
            providers[item.provider] = [];
        }
        providers[item.provider].push(item);
    });

    // Display inventory
    displayInventoryByProvider(providers);

    // Check for low stock
    checkLowStock(inventory);
}

function calculateTotals(inventory) {
    const totals = {
        filled: 0,
        empty: 0,
        in_transit: 0,
        damaged: 0
    };

    inventory.forEach(item => {
        totals.filled += item.filled;
        totals.empty += item.empty;
        totals.in_transit += item.in_transit;
        totals.damaged += item.damaged;
    });

    // Update summary cards
    $('#totalFilled').text(totals.filled);
    $('#totalEmpty').text(totals.empty);
    $('#totalInTransit').text(totals.in_transit);
    $('#totalDamaged').text(totals.damaged);

    // Add animation to updated values
    animateValue('totalFilled', totals.filled);
    animateValue('totalEmpty', totals.empty);
    animateValue('totalInTransit', totals.in_transit);
    animateValue('totalDamaged', totals.damaged);
}

function animateValue(elementId, finalValue) {
    const element = $(`#${elementId}`);
    const currentValue = parseInt(element.text()) || 0;
    
    if (currentValue === finalValue) return;
    
    element.addClass('scale-110 text-orange-600');
    setTimeout(() => {
        element.removeClass('scale-110 text-orange-600');
    }, 300);
}

function displayInventoryByProvider(providers) {
    let html = '';

    if (Object.keys(providers).length === 0) {
        html = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
                <p class="text-gray-500 font-medium">No inventory data</p>
                <p class="text-sm text-gray-400 mt-1">Stock data will appear here</p>
            </div>
        `;
    } else {
        Object.keys(providers).sort().forEach((providerName, providerIndex) => {
            const items = providers[providerName];
            
            // Calculate provider totals
            const providerTotal = {
                filled: items.reduce((sum, i) => sum + i.filled, 0),
                empty: items.reduce((sum, i) => sum + i.empty, 0),
                in_transit: items.reduce((sum, i) => sum + i.in_transit, 0),
                damaged: items.reduce((sum, i) => sum + i.damaged, 0)
            };

            const totalCylinders = providerTotal.filled + providerTotal.empty + providerTotal.in_transit;
            const filledPercentage = totalCylinders > 0 ? Math.round((providerTotal.filled / totalCylinders) * 100) : 0;

            html += `
                <div class="card animate-slide-up" style="animation-delay: ${providerIndex * 0.1}s">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-900 text-lg">${providerName}</h3>
                                <p class="text-sm text-gray-500">${items.length} cylinder type${items.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-medium text-orange-600">${filledPercentage}% Filled</p>
                            <p class="text-xs text-gray-500">${totalCylinders} total</p>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="mb-4">
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" 
                                 style="width: ${filledPercentage}%"></div>
                        </div>
                        <div class="flex justify-between mt-2 text-xs text-gray-600">
                            <span>Filled: ${providerTotal.filled}</span>
                            <span>Empty: ${providerTotal.empty}</span>
                            <span>Transit: ${providerTotal.in_transit}</span>
                        </div>
                    </div>

                    <!-- Cylinder Sizes -->
                    <div class="space-y-3">
            `;

            items.sort((a, b) => parseFloat(a.kg) - parseFloat(b.kg)).forEach((item, itemIndex) => {
                const itemTotal = item.filled + item.empty + item.in_transit;
                const itemFilledPct = itemTotal > 0 ? Math.round((item.filled / itemTotal) * 100) : 0;
                const isLowStock = item.filled < LOW_STOCK_THRESHOLD && item.filled > 0;

                html += `
                    <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-200 transition-colors">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-gray-900">${item.kg} kg</span>
                                ${isLowStock ? `
                                    <span class="badge badge-warning text-xs">Low Stock</span>
                                ` : ''}
                            </div>
                            <span class="text-sm font-medium text-gray-600">${itemTotal} total</span>
                        </div>

                        <div class="grid grid-cols-4 gap-2 text-center">
                            <div>
                                <div class="text-lg font-bold text-green-600">${item.filled}</div>
                                <div class="text-xs text-gray-500">Filled</div>
                            </div>
                            <div>
                                <div class="text-lg font-bold text-gray-600">${item.empty}</div>
                                <div class="text-xs text-gray-500">Empty</div>
                            </div>
                            <div>
                                <div class="text-lg font-bold text-orange-600">${item.in_transit}</div>
                                <div class="text-xs text-gray-500">Transit</div>
                            </div>
                            <div>
                                <div class="text-lg font-bold text-red-600">${item.damaged}</div>
                                <div class="text-xs text-gray-500">Damaged</div>
                            </div>
                        </div>

                        <!-- Mini Progress Bar -->
                        <div class="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                            <div class="bg-green-500 h-1.5 rounded-full transition-all" 
                                 style="width: ${itemFilledPct}%"></div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });
    }

    $('#inventoryByProvider').html(html);
}

function checkLowStock(inventory) {
    const lowStockItems = inventory.filter(item => 
        item.filled > 0 && item.filled < LOW_STOCK_THRESHOLD
    );

    if (lowStockItems.length === 0) {
        $('#lowStockSection').hide();
        return;
    }

    $('#lowStockSection').show();

    let html = '';
    lowStockItems.forEach((item, index) => {
        const percentageOfThreshold = Math.round((item.filled / LOW_STOCK_THRESHOLD) * 100);
        
        html += `
            <div class="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg" 
                 style="animation: slideUp 0.5s ease-out ${index * 0.1}s both">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        <div>
                            <p class="font-semibold text-gray-900">${item.provider} ${item.kg}kg - Filled</p>
                            <p class="text-sm text-gray-600">Only ${item.filled} cylinders remaining</p>
                        </div>
                    </div>
                    <span class="text-lg font-bold text-red-600">${percentageOfThreshold}%</span>
                </div>
                <div class="mt-2 w-full bg-red-200 rounded-full h-2">
                    <div class="bg-red-600 h-2 rounded-full transition-all" 
                         style="width: ${percentageOfThreshold}%"></div>
                </div>
            </div>
        `;
    });

    $('#lowStockList').html(html);
}

// ==================== STOCK ADJUSTMENT ====================

function openAdjustmentModal() {
    $('#adjustmentForm')[0].reset();
    $('#adjustmentModal').removeClass('hidden');
}

function closeAdjustmentModal() {
    $('#adjustmentModal').addClass('hidden');
}

async function adjustStock() {  // ← Made async
    const user = getCurrentUser();
    const provider = $('#adjustProvider').val();
    const kg = $('#adjustKg').val();
    const type = $('#adjustType').val();
    const adjustmentType = $('#adjustmentType').val();
    const quantity = parseInt($('#adjustQuantity').val());
    const reason = $('#adjustReason').val().trim();

    if (!provider || !kg || !type || !adjustmentType || !quantity) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (quantity <= 0) {
        showToast('Quantity must be greater than 0', 'error');
        return;
    }

    let inventory = await getInventory();  // ← Added await
    
    // Find or create inventory item
    let invItem = inventory.find(i => 
        i.godown_id === user.godown_id &&
        i.provider === provider &&
        i.kg === kg
    );

    if (!invItem) {
        // Create new inventory item
        invItem = {
            godown_id: user.godown_id,
            provider: provider,
            kg: kg,
            filled: 0,
            empty: 0,
            in_transit: 0,
            damaged: 0
        };
        inventory.push(invItem);
    }

    // Apply adjustment
    const multiplier = adjustmentType === 'add' ? 1 : -1;
    const adjustAmount = quantity * multiplier;

    switch(type) {
        case 'filled':
            invItem.filled = Math.max(0, invItem.filled + adjustAmount);
            break;
        case 'empty':
            invItem.empty = Math.max(0, invItem.empty + adjustAmount);
            break;
        case 'damaged':
            invItem.damaged = Math.max(0, invItem.damaged + adjustAmount);
            break;
    }

    // Log adjustment (could be saved to a separate adjustments log)
    console.log('Stock Adjustment:', {
        timestamp: new Date().toISOString(),
        user: user.name,
        provider,
        kg,
        type,
        adjustment: adjustmentType === 'add' ? `+${quantity}` : `-${quantity}`,
        reason,
        new_value: invItem[type]
    });

    // UPDATED: Use Supabase instead of localStorage
    await saveInventory(inventory);

    const action = adjustmentType === 'add' ? 'added' : 'removed';
    showToast(`Successfully ${action} ${quantity} ${provider} ${kg}kg ${type} cylinders`, 'success');

    closeAdjustmentModal();
    await loadInventory();
}

// ==================== HELPER FUNCTIONS ====================

async function exportInventoryReport() {  // ← Made async
    const user = getCurrentUser();
    const inventory = (await getInventory()).filter(i => i.godown_id === user.godown_id);  // ← Added await
    const godowns = await getGodowns();  // ← Added await
    const godown = godowns.find(g => g.id === user.godown_id);

    let report = `Inventory Report - ${godown.name}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `\n`;
    report += `Provider,Size,Filled,Empty,In Transit,Damaged,Total\n`;

    inventory.forEach(item => {
        const total = item.filled + item.empty + item.in_transit + item.damaged;
        report += `${item.provider},${item.kg}kg,${item.filled},${item.empty},${item.in_transit},${item.damaged},${total}\n`;
    });

    // Calculate totals
    const totals = {
        filled: inventory.reduce((sum, i) => sum + i.filled, 0),
        empty: inventory.reduce((sum, i) => sum + i.empty, 0),
        in_transit: inventory.reduce((sum, i) => sum + i.in_transit, 0),
        damaged: inventory.reduce((sum, i) => sum + i.damaged, 0)
    };
    const grandTotal = totals.filled + totals.empty + totals.in_transit + totals.damaged;

    report += `\n`;
    report += `TOTALS,,${totals.filled},${totals.empty},${totals.in_transit},${totals.damaged},${grandTotal}\n`;

    // Download as CSV
    const blob = new Blob([report], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast('Report downloaded successfully', 'success');
}