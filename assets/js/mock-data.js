// Mock Data for HP Gas Management System
// ============================================
// HYBRID APPROACH: Supabase + localStorage (commented)
// ============================================

// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://fkkbcmmsdjvvslmfxpsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZra2JjbW1zZGp2dnNsbWZ4cHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMDE4MjQsImV4cCI6MjA3ODg3NzgyNH0.GmiCEmSP_1-aJG5MbHUkTvQYY7MCqP-shEziPhPH6J8'; // Replace with your actual anon key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized');

// ===== MOCK DATA FOR INITIAL SEEDING =====
const mockData = {
    users: [
        // Super Admin
        {
            id: 1,
            email: 'admin@hpgas.com',
            password: 'admin123',
            role: 'super_admin',
            name: 'Rajesh Kumar',
            phone: '9876543210',
            godown_id: null,
            status: 'active'
        },
        // Manager - Chennai Main Godown
        {
            id: 2,
            email: 'manager@hpgas.com',
            password: 'manager123',
            role: 'manager',
            name: 'Suresh Babu',
            phone: '9876543211',
            godown_id: 1,
            status: 'active'
        },
        // Manager - Coimbatore Godown
        {
            id: 3,
            email: 'anand@hpgas.com',
            password: 'manager123',
            role: 'manager',
            name: 'Anand Raj',
            phone: '9876543212',
            godown_id: 2,
            status: 'active'
        },
        // Drivers - Chennai Main Godown
        {
            id: 4,
            email: 'ravi@hpgas.com',
            password: 'driver123',
            role: 'driver',
            name: 'Ravi Kumar',
            phone: '9876543220',
            godown_id: 1,
            status: 'active'
        },
        {
            id: 5,
            email: 'prakash@hpgas.com',
            password: 'driver123',
            role: 'driver',
            name: 'Prakash M',
            phone: '9876543221',
            godown_id: 1,
            status: 'active'
        },
        // Driver - Coimbatore Godown
        {
            id: 6,
            email: 'vijay@hpgas.com',
            password: 'driver123',
            role: 'driver',
            name: 'Vijay S',
            phone: '9876543222',
            godown_id: 2,
            status: 'active'
        },
        // Loadmen - Chennai Main Godown
        {
            id: 7,
            email: 'murugan@hpgas.com',
            password: 'loadman123',
            role: 'loadman',
            name: 'Murugan',
            phone: '9876543230',
            godown_id: 1,
            status: 'active'
        },
        {
            id: 8,
            email: 'selvam@hpgas.com',
            password: 'loadman123',
            role: 'loadman',
            name: 'Selvam',
            phone: '9876543231',
            godown_id: 1,
            status: 'active'
        },
        // Loadman - Coimbatore Godown
        {
            id: 9,
            email: 'kumar@hpgas.com',
            password: 'loadman123',
            role: 'loadman',
            name: 'Kumar',
            phone: '9876543232',
            godown_id: 2,
            status: 'active'
        }
    ],

    godowns: [
        {
            id: 1,
            name: 'Chennai Main Godown',
            address: '123, Anna Salai, Near Central Station, T. Nagar, Chennai',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600002',
            phone: '044-12345678',
            latitude: '13.0827',
            longitude: '80.2707',
            email: 'chennai@sreemaruthi.com',
            created_at: '2024-01-15'
        },
        {
            id: 2,
            name: 'Coimbatore Branch Godown',
            address: '456, RS Puram Main Road, Near Railway Station, Coimbatore',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641002',
            phone: '0422-987654',
            latitude: '11.0168',
            longitude: '76.9558',
            email: 'coimbatore@sreemaruthi.com',
            created_at: '2024-02-10'
        }
    ],

    customers: [],
    vehicles: [],
    filling_stations: [],
    trips: [],
    deliveries: [],
    inventory: []
};

// ===== INITIALIZATION =====
async function initializeMockData() {
    try {
        console.log('🔄 Initializing data...');
        
        // Check if data already exists in Supabase
        const { data: existingUsers } = await supabase
            .from('app_data')
            .select('key')
            .eq('key', 'users')
            .single();
        
        if (!existingUsers) {
            console.log('📦 Seeding initial data to Supabase...');
            
            // Seed all initial data
            await Promise.all([
                saveToSupabase('users', mockData.users),
                saveToSupabase('godowns', mockData.godowns),
                saveToSupabase('customers', mockData.customers),
                saveToSupabase('vehicles', mockData.vehicles),
                saveToSupabase('filling_stations', mockData.filling_stations),
                saveToSupabase('trips', mockData.trips),
                saveToSupabase('deliveries', mockData.deliveries),
                saveToSupabase('inventory', mockData.inventory)
            ]);
            
            console.log('✅ Initial data seeded successfully!');
        } else {
            console.log('✅ Data already exists in Supabase');
        }
    } catch (error) {
        console.error('❌ Error initializing data:', error);
        // Fallback to localStorage if Supabase fails
        // initializeMockDataLocalStorage();
    }
}

// ===== SUPABASE HELPER FUNCTIONS =====
async function getFromSupabase(key) {
    try {
        const { data, error } = await supabase
            .from('app_data')
            .select('value')
            .eq('key', key)
            .single();
        
        if (error) throw error;
        return data?.value || [];
    } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        // Fallback to localStorage
        // return getFromLocalStorage(key);
        return [];
    }
}

async function saveToSupabase(key, value) {
    try {
        const { error } = await supabase
            .from('app_data')
            .upsert({ 
                key: key, 
                value: value,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        console.log(`✅ ${key} saved to Supabase`);
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        // Fallback to localStorage
        // saveToLocalStorage(key, value);
    }
}

// ===== GET FUNCTIONS (Using Supabase) =====
async function getUsers() {
    return await getFromSupabase('users');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_users')) || [];
}

async function getGodowns() {
    return await getFromSupabase('godowns');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_godowns')) || [];
}

async function getCustomers() {
    return await getFromSupabase('customers');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_customers')) || [];
}

async function getVehicles() {
    return await getFromSupabase('vehicles');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_vehicles')) || [];
}

async function getFillingStations() {
    return await getFromSupabase('filling_stations');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_filling_stations')) || [];
}

async function getTrips() {
    return await getFromSupabase('trips');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_trips')) || [];
}

async function getDeliveries() {
    return await getFromSupabase('deliveries');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_deliveries')) || [];
}

async function getInventory() {
    return await getFromSupabase('inventory');
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // return JSON.parse(localStorage.getItem('hpgas_inventory')) || [];
}

// ===== BACKWARD COMPATIBILITY FUNCTIONS =====
async function getDrivers() {
    const users = await getUsers();
    return users.filter(u => u.role === 'driver');
}

async function getLoadmen() {
    const users = await getUsers();
    return users.filter(u => u.role === 'loadman');
}

// ===== SAVE FUNCTIONS (Using Supabase) =====
async function saveUsers(users) {
    await saveToSupabase('users', users);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_users', JSON.stringify(users));
}

async function saveGodowns(godowns) {
    await saveToSupabase('godowns', godowns);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_godowns', JSON.stringify(godowns));
}

async function saveCustomers(customers) {
    await saveToSupabase('customers', customers);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_customers', JSON.stringify(customers));
}

async function saveVehicles(vehicles) {
    await saveToSupabase('vehicles', vehicles);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_vehicles', JSON.stringify(vehicles));
}

async function saveFillingStations(stations) {
    await saveToSupabase('filling_stations', stations);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_filling_stations', JSON.stringify(stations));
}

async function saveTrips(trips) {
    await saveToSupabase('trips', trips);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_trips', JSON.stringify(trips));
}

async function saveDeliveries(deliveries) {
    await saveToSupabase('deliveries', deliveries);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_deliveries', JSON.stringify(deliveries));
}

async function saveInventory(inventory) {
    await saveToSupabase('inventory', inventory);
    
    // OLD LOCALSTORAGE CODE (COMMENTED):
    // localStorage.setItem('hpgas_inventory', JSON.stringify(inventory));
}

// ===== LOCALSTORAGE FALLBACK (COMMENTED BUT AVAILABLE) =====
/*
function initializeMockDataLocalStorage() {
    if (!localStorage.getItem('hpgas_users')) {
        localStorage.setItem('hpgas_users', JSON.stringify(mockData.users));
    }
    if (!localStorage.getItem('hpgas_godowns')) {
        localStorage.setItem('hpgas_godowns', JSON.stringify(mockData.godowns));
    }
    if (!localStorage.getItem('hpgas_customers')) {
        localStorage.setItem('hpgas_customers', JSON.stringify(mockData.customers));
    }
    if (!localStorage.getItem('hpgas_vehicles')) {
        localStorage.setItem('hpgas_vehicles', JSON.stringify(mockData.vehicles));
    }
    if (!localStorage.getItem('hpgas_filling_stations')) {
        localStorage.setItem('hpgas_filling_stations', JSON.stringify(mockData.filling_stations));
    }
    if (!localStorage.getItem('hpgas_trips')) {
        localStorage.setItem('hpgas_trips', JSON.stringify(mockData.trips));
    }
    if (!localStorage.getItem('hpgas_deliveries')) {
        localStorage.setItem('hpgas_deliveries', JSON.stringify(mockData.deliveries));
    }
    if (!localStorage.getItem('hpgas_inventory')) {
        localStorage.setItem('hpgas_inventory', JSON.stringify(mockData.inventory));
    }
}

function getFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(`hpgas_${key}`)) || [];
}

function saveToLocalStorage(key, value) {
    localStorage.setItem(`hpgas_${key}`, JSON.stringify(value));
}
*/

// ===== INITIALIZE ON LOAD =====
initializeMockData();