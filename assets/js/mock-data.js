// Mock Data for HP Gas Management System

const mockData = {
    users: [
        {
            id: 1,
            email: 'admin@hpgas.com',
            password: 'admin123',
            role: 'super_admin',
            name: 'Rajesh Kumar',
            phone: '9876543210',
            godown_id: null
        },
        {
            id: 2,
            email: 'manager@hpgas.com',
            password: 'manager123',
            role: 'manager',
            name: 'Suresh Babu',
            phone: '9876543211',
            godown_id: 1
        },
        {
            id: 3,
            email: 'driver@hpgas.com',
            password: 'driver123',
            role: 'driver',
            name: 'Murugan',
            phone: '9876543212',
            godown_id: 1
        }
    ],

    godowns: [
        {
            id: 1,
            name: 'Chennai Main Godown',
            address: '123, Anna Salai, Chennai',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '600002',
            manager_id: 2,
            phone: '044-12345678',
            created_at: '2024-01-15'
        },
        {
            id: 2,
            name: 'Coimbatore Godown',
            address: '456, RS Puram, Coimbatore',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641002',
            manager_id: null,
            phone: '0422-987654',
            created_at: '2024-02-10'
        }
    ],

    customers: [
        {
            id: 1,
            name: 'Hotel Saravana Bhavan',
            business_type: 'Restaurant',
            status: 'active',
            address: '78, Mount Road, T. Nagar, Chennai',
            city: 'Chennai',
            pincode: '600017',
            latitude: 13.0418,
            longitude: 80.2341,
            primary_contact: {
                name: 'Ramanathan',
                phone: '9841234567',
                whatsapp: '9841234567',
                email: 'rama@saravanabhavan.com'
            },
            secondary_contact: {
                name: 'Kumar',
                phone: '9841234577',
                whatsapp: '9841234577',
                email: 'kumar@saravanabhavan.com'
            },
            notes: 'Regular customer, prefers morning delivery between 7-9 AM',
            godown_id: 1,
            created_at: '2024-01-20'
        },
        {
            id: 2,
            name: 'Taj Hotels',
            business_type: 'Hotel',
            status: 'active',
            address: '45, Cathedral Road, Gopalapuram, Chennai',
            city: 'Chennai',
            pincode: '600086',
            latitude: 13.0601,
            longitude: 80.2565,
            primary_contact: {
                name: 'Venkatesh',
                phone: '9841234568',
                whatsapp: '9841234568',
                email: 'venkat@tajhotels.com'
            },
            secondary_contact: {
                name: 'Priya',
                phone: '9841234578',
                whatsapp: '9841234578',
                email: 'priya@tajhotels.com'
            },
            notes: 'Large orders, weekly delivery on Mondays',
            godown_id: 1,
            created_at: '2024-01-22'
        },
        {
            id: 3,
            name: 'Annapoorna Mess',
            business_type: 'Restaurant',
            status: 'active',
            address: '23, TTK Road, Alwarpet, Chennai',
            city: 'Chennai',
            pincode: '600018',
            latitude: 13.0475,
            longitude: 80.2456,
            primary_contact: {
                name: 'Selvam',
                phone: '9841234569',
                whatsapp: '9841234569',
                email: 'selvam@annapoorna.com'
            },
            secondary_contact: {
                name: '',
                phone: '',
                whatsapp: '',
                email: ''
            },
            notes: 'Small quantities, bi-weekly delivery',
            godown_id: 1,
            created_at: '2024-02-01'
        },
        {
            id: 4,
            name: 'Grand Plaza Hotel',
            business_type: 'Hotel',
            status: 'active',
            address: '67, Nungambakkam High Road, Chennai',
            city: 'Chennai',
            pincode: '600034',
            latitude: 13.0615,
            longitude: 80.2423,
            primary_contact: {
                name: 'Suresh Kumar',
                phone: '9841234570',
                whatsapp: '9841234570',
                email: 'suresh@grandplaza.com'
            },
            secondary_contact: {
                name: 'Meena',
                phone: '9841234580',
                whatsapp: '',
                email: 'meena@grandplaza.com'
            },
            notes: 'Premium customer, flexible delivery schedule',
            godown_id: 1,
            created_at: '2024-02-05'
        },
        {
            id: 5,
            name: 'Apollo Hospitals',
            business_type: 'Hospital',
            status: 'active',
            address: 'No. 21, Greams Lane, Off Greams Road, Chennai',
            city: 'Chennai',
            pincode: '600006',
            latitude: 13.0569,
            longitude: 80.2495,
            primary_contact: {
                name: 'Dr. Srinivasan',
                phone: '9840234567',
                whatsapp: '',
                email: 'srini@apollo.com'
            },
            secondary_contact: {
                name: 'Lakshmi (Admin)',
                phone: '9840234568',
                whatsapp: '9840234568',
                email: 'lakshmi@apollo.com'
            },
            notes: 'Emergency contact available 24/7. Priority customer.',
            godown_id: 1,
            created_at: '2024-02-10'
        },
        {
            id: 6,
            name: 'Murugan Idli Shop',
            business_type: 'Restaurant',
            status: 'active',
            address: '789, Mount Road, Thousand Lights, Chennai',
            city: 'Chennai',
            pincode: '600006',
            latitude: 13.0569,
            longitude: 80.2641,
            primary_contact: {
                name: 'Murugan',
                phone: '9841345678',
                whatsapp: '9841345678',
                email: 'contact@muruganidli.com'
            },
            secondary_contact: {
                name: '',
                phone: '',
                whatsapp: '',
                email: ''
            },
            notes: 'Early morning delivery preferred (before 6 AM)',
            godown_id: 1,
            created_at: '2024-02-15'
        },
        {
            id: 7,
            name: 'DAV School',
            business_type: 'School',
            status: 'active',
            address: '234, Anna Nagar Main Road, Chennai',
            city: 'Chennai',
            pincode: '600040',
            latitude: 13.0878,
            longitude: 80.2086,
            primary_contact: {
                name: 'Ramesh Kumar (Principal)',
                phone: '9840456789',
                whatsapp: '',
                email: 'principal@davschool.edu'
            },
            secondary_contact: {
                name: 'Meena (Admin Officer)',
                phone: '9840456790',
                whatsapp: '9840456790',
                email: 'admin@davschool.edu'
            },
            notes: 'Delivery only during school hours 9 AM - 4 PM. Call before visit.',
            godown_id: 1,
            created_at: '2024-02-20'
        },
        {
            id: 8,
            name: 'Paradise Catering Services',
            business_type: 'Catering',
            status: 'active',
            address: '567, Velachery Main Road, Chennai',
            city: 'Chennai',
            pincode: '600042',
            latitude: 12.9756,
            longitude: 80.2217,
            primary_contact: {
                name: 'Ashok',
                phone: '9841567890',
                whatsapp: '9841567890',
                email: 'ashok@paradisecatering.com'
            },
            secondary_contact: {
                name: 'Divya',
                phone: '9841567891',
                whatsapp: '9841567891',
                email: 'divya@paradisecatering.com'
            },
            notes: 'Variable delivery schedule based on events. Call 2 days in advance.',
            godown_id: 1,
            created_at: '2024-03-01'
        },
        {
            id: 9,
            name: 'Anjappar Chettinad Restaurant',
            business_type: 'Restaurant',
            status: 'active',
            address: '345, Nungambakkam High Road, Chennai',
            city: 'Chennai',
            pincode: '600034',
            latitude: 13.0569,
            longitude: 80.2495,
            primary_contact: {
                name: 'Selvam',
                phone: '9841789012',
                whatsapp: '9841789012',
                email: 'selvam@anjappar.com'
            },
            secondary_contact: {
                name: 'Geetha',
                phone: '9841789013',
                whatsapp: '',
                email: 'geetha@anjappar.com'
            },
            notes: 'High volume customer. Twice weekly delivery - Mon & Thu.',
            godown_id: 1,
            created_at: '2024-03-05'
        },
        {
            id: 10,
            name: 'MIOT Hospital',
            business_type: 'Hospital',
            status: 'active',
            address: '4/112, Mount Poonamallee Road, Manapakkam, Chennai',
            city: 'Chennai',
            pincode: '600089',
            latitude: 13.0172,
            longitude: 80.1806,
            primary_contact: {
                name: 'Dr. Anand',
                phone: '9840890123',
                whatsapp: '',
                email: 'anand@miot.com'
            },
            secondary_contact: {
                name: 'Radha (Purchase Officer)',
                phone: '9840890124',
                whatsapp: '9840890124',
                email: 'purchase@miot.com'
            },
            notes: 'Priority customer - emergency delivery available. Large orders.',
            godown_id: 1,
            created_at: '2024-03-10'
        },
        {
            id: 11,
            name: 'The Park Hotel',
            business_type: 'Hotel',
            status: 'active',
            address: '601, Anna Salai, Teynampet, Chennai',
            city: 'Chennai',
            pincode: '600018',
            latitude: 13.0418,
            longitude: 80.2569,
            primary_contact: {
                name: 'Karthik',
                phone: '9841901234',
                whatsapp: '9841901234',
                email: 'karthik@theparkhotels.com'
            },
            secondary_contact: {
                name: 'Anjali',
                phone: '9841901235',
                whatsapp: '9841901235',
                email: 'anjali@theparkhotels.com'
            },
            notes: 'Premium customer. Flexible delivery schedule, prefers afternoon.',
            godown_id: 1,
            created_at: '2024-03-15'
        },
        {
            id: 12,
            name: 'Grand Sweets & Snacks',
            business_type: 'Restaurant',
            status: 'inactive',
            address: '890, East Coast Road, Thiruvanmiyur, Chennai',
            city: 'Chennai',
            pincode: '600041',
            latitude: 12.9833,
            longitude: 80.2611,
            primary_contact: {
                name: 'Shankar',
                phone: '9840678901',
                whatsapp: '',
                email: 'shankar@grandsweets.com'
            },
            secondary_contact: {
                name: '',
                phone: '',
                whatsapp: '',
                email: ''
            },
            notes: 'Currently closed for renovation. Will resume in 2 months.',
            godown_id: 1,
            created_at: '2024-03-20'
        },
        {
            id: 13,
            name: 'Kovalam Beach Resort',
            business_type: 'Hotel',
            status: 'active',
            address: 'ECR Main Road, Kovalam, Chennai',
            city: 'Chennai',
            pincode: '600041',
            latitude: 12.7879,
            longitude: 80.2546,
            primary_contact: {
                name: 'Rajesh',
                phone: '9842012345',
                whatsapp: '9842012345',
                email: 'rajesh@kovalamresort.com'
            },
            secondary_contact: {
                name: 'Shalini',
                phone: '9842012346',
                whatsapp: '',
                email: 'shalini@kovalamresort.com'
            },
            notes: 'Weekend orders are higher. Confirm quantity on Friday.',
            godown_id: 1,
            created_at: '2024-04-01'
        },
        {
            id: 14,
            name: 'Chennai Silks Canteen',
            business_type: 'Catering',
            status: 'active',
            address: '543, Usman Road, T. Nagar, Chennai',
            city: 'Chennai',
            pincode: '600017',
            latitude: 13.0418,
            longitude: 80.2341,
            primary_contact: {
                name: 'Balamurugan',
                phone: '9843123456',
                whatsapp: '9843123456',
                email: 'bala@chennaisilks.com'
            },
            secondary_contact: {
                name: '',
                phone: '',
                whatsapp: '',
                email: ''
            },
            notes: 'Employee canteen. Fixed monthly orders.',
            godown_id: 1,
            created_at: '2024-04-05'
        },
        {
            id: 15,
            name: 'St. Thomas School',
            business_type: 'School',
            status: 'active',
            address: 'West Mambalam Main Road, Chennai',
            city: 'Chennai',
            pincode: '600033',
            latitude: 13.0338,
            longitude: 80.2283,
            primary_contact: {
                name: 'Fr. Joseph',
                phone: '9844234567',
                whatsapp: '',
                email: 'principal@stthomas.edu'
            },
            secondary_contact: {
                name: 'Mrs. Shanthi (Bursar)',
                phone: '9844234568',
                whatsapp: '9844234568',
                email: 'accounts@stthomas.edu'
            },
            notes: 'Hostel kitchen. Weekly delivery on Saturdays.',
            godown_id: 1,
            created_at: '2024-04-10'
        }
    ],

    vehicles: [
        {
            id: 1,
            vehicle_number: 'TN01AB1234',
            vehicle_type: 'Truck',
            godown_id: 1,
            primary_driver_id: 3,
            primary_loadman1_id: 4,
            primary_loadman2_id: 5,
            status: 'active',
            created_at: '2024-01-15'
        },
        {
            id: 2,
            vehicle_number: 'TN01CD5678',
            vehicle_type: 'Van',
            godown_id: 1,
            primary_driver_id: null,
            primary_loadman1_id: null,
            primary_loadman2_id: null,
            status: 'active',
            created_at: '2024-01-20'
        }
    ],

    drivers: [
        {
            id: 3,
            name: 'Murugan',
            phone: '9876543212',
            license_number: 'TN0120230045678',
            godown_id: 1,
            status: 'active',
            created_at: '2024-01-15'
        },
        {
            id: 6,
            name: 'Selvam',
            phone: '9876543213',
            license_number: 'TN0120230045679',
            godown_id: 1,
            status: 'active',
            created_at: '2024-01-18'
        }
    ],

    loadmen: [
        {
            id: 4,
            name: 'Kumar',
            phone: '9876543214',
            godown_id: 1,
            status: 'active',
            created_at: '2024-01-15'
        },
        {
            id: 5,
            name: 'Raju',
            phone: '9876543215',
            godown_id: 1,
            status: 'active',
            created_at: '2024-01-15'
        }
    ],

    filling_stations: [
        {
            id: 1,
            name: 'HP Gas Bottling Plant - Ambattur',
            status: 'active',
            address: 'Plot No. 45, Industrial Estate, Ambattur',
            city: 'Chennai',
            pincode: '600098',
            latitude: 13.1143,
            longitude: 80.1548,
            contact_person: 'Venkatesh Kumar',
            phone: '9876543220',
            alternate_phone: '044-26254567',
            email: 'venkat@hpgas-ambattur.com',
            providers: ['HP Gas'],
            notes: 'Main bottling plant for HP Gas. Prior appointment required for bulk refills.',
            created_at: '2024-01-10'
        },
        {
            id: 2,
            name: 'Indane Bottling Plant - Madhavaram',
            status: 'active',
            address: 'No. 234, Madhavaram High Road, Madhavaram',
            city: 'Chennai',
            pincode: '600060',
            latitude: 13.1482,
            longitude: 80.2314,
            contact_person: 'Ramesh Babu',
            phone: '9876543221',
            alternate_phone: '044-26541234',
            email: 'ramesh@indane-madhavaram.com',
            providers: ['Indane'],
            notes: 'Large capacity plant. Can handle emergency refills with prior notice.',
            created_at: '2024-01-12'
        },
        {
            id: 3,
            name: 'Multi-Brand Refilling Hub - Guindy',
            status: 'active',
            address: 'Industrial Area, Guindy, Near Metro Station',
            city: 'Chennai',
            pincode: '600032',
            latitude: 13.0067,
            longitude: 80.2206,
            contact_person: 'Prakash Reddy',
            phone: '9876543223',
            alternate_phone: '044-22501234',
            email: 'prakash@multigas-guindy.com',
            providers: ['HP Gas', 'Indane'],
            notes: 'Authorized refilling station for both HP Gas and Indane. Fast turnaround time.',
            created_at: '2024-02-01'
        },
        {
            id: 4,
            name: 'HP Gas Plant - Sriperumbudur',
            status: 'active',
            address: 'SIPCOT Industrial Park, Phase 2, Sriperumbudur',
            city: 'Sriperumbudur',
            pincode: '602105',
            latitude: 12.9698,
            longitude: 79.9478,
            contact_person: 'Karthikeyan',
            phone: '9876543224',
            alternate_phone: '044-27162345',
            email: 'karthik@hpgas-spbt.com',
            providers: ['HP Gas'],
            notes: 'Large industrial plant. Suitable for high volume requirements. Located 45km from Chennai.',
            created_at: '2024-02-10'
        },
        {
            id: 5,
            name: 'Indane Refill Center - Velachery',
            status: 'active',
            address: '123, Velachery Main Road, Near Bypass',
            city: 'Chennai',
            pincode: '600042',
            latitude: 12.9756,
            longitude: 80.2217,
            contact_person: 'Murugan',
            phone: '9876543225',
            alternate_phone: '044-22345678',
            email: 'murugan@indane-velachery.com',
            providers: ['Indane'],
            notes: 'Convenient location in South Chennai. Quick service for regular customers.',
            created_at: '2024-02-15'
        },
        {
            id: 6,
            name: 'HP-Indane Joint Facility - Poonamallee',
            status: 'active',
            address: 'Poonamallee High Road, Near Bypass Junction',
            city: 'Chennai',
            pincode: '600056',
            latitude: 13.0483,
            longitude: 80.0965,
            contact_person: 'Rajendran',
            phone: '9876543227',
            alternate_phone: '044-26783456',
            email: 'raj@gascentral-poonamallee.com',
            providers: ['HP Gas', 'Indane'],
            notes: 'Joint facility for HP and Indane. Good rates for bulk orders.',
            created_at: '2024-03-10'
        },
        {
            id: 7,
            name: 'HP Gas Express Station - OMR',
            status: 'active',
            address: 'Old Mahabalipuram Road, Near Sholinganallur',
            city: 'Chennai',
            pincode: '600119',
            latitude: 12.9010,
            longitude: 80.2279,
            contact_person: 'Dinesh Kumar',
            phone: '9876543228',
            alternate_phone: '044-24531234',
            email: 'dinesh@hpgas-omr.com',
            providers: ['HP Gas'],
            notes: 'Convenient location for IT corridor customers. Fast service guaranteed.',
            created_at: '2024-03-15'
        },
        {
            id: 8,
            name: 'Indane Bottling Plant - Redhills',
            status: 'maintenance',
            address: 'Redhills Industrial Area, NH16',
            city: 'Chennai',
            pincode: '600052',
            latitude: 13.1932,
            longitude: 80.1581,
            contact_person: 'Subramaniam',
            phone: '9876543226',
            alternate_phone: '',
            email: 'subbu@indane-redhills.com',
            providers: ['Indane'],
            notes: 'Currently under maintenance. Expected to resume operations from next month.',
            created_at: '2024-03-01'
        },
        {
            id: 9,
            name: 'Indane Ultra Plant - Tambaram',
            status: 'inactive',
            address: 'GST Road, Tambaram Industrial Estate',
            city: 'Chennai',
            pincode: '600045',
            latitude: 12.9249,
            longitude: 80.1000,
            contact_person: 'Vinoth',
            phone: '9876543229',
            alternate_phone: '',
            email: 'vinoth@indane-tambaram.com',
            providers: ['Indane'],
            notes: 'Temporarily closed due to expansion work. Will reopen with increased capacity.',
            created_at: '2024-04-01'
        },
        {
            id: 10,
            name: 'HP Gas Distribution Hub - Avadi',
            status: 'active',
            address: 'Avadi Main Road, Industrial Estate',
            city: 'Chennai',
            pincode: '600054',
            latitude: 13.1067,
            longitude: 80.1014,
            contact_person: 'Selvam',
            phone: '9876543230',
            alternate_phone: '044-26541122',
            email: 'selvam@hpgas-avadi.com',
            providers: ['HP Gas'],
            notes: 'New facility with modern equipment. Excellent service quality.',
            created_at: '2024-04-10'
        }
    ],

    trips: [
        {
            id: 1,
            dc_number: 'DC/2024/001',
            trip_type: 'delivery', // delivery or refill
            godown_id: 1,
            vehicle_id: 1,
            driver_id: 3,
            loadman1_id: 4,
            loadman2_id: 5,
            start_km: 15234,
            start_time: '2024-11-15 08:30:00',
            end_km: null,
            end_time: null,
            status: 'ongoing', // ongoing, completed
            created_by: 2,
            created_at: '2024-11-15 08:00:00',
            // Load details
            load_details: [
                { provider: 'HP', kg: '5', type: 'filled', quantity: 10 },
                { provider: 'HP', kg: '19', type: 'filled', quantity: 20 },
                { provider: 'HP', kg: '19', type: 'empty', quantity: 15 },
                { provider: 'Indane', kg: '19', type: 'filled', quantity: 10 }
            ]
        },
        {
            id: 2,
            dc_number: 'DC/2024/002',
            trip_type: 'refill',
            godown_id: 1,
            vehicle_id: 2,
            driver_id: 6,
            loadman1_id: 4,
            loadman2_id: null,
            filling_station_id: 1,
            start_km: 8567,
            start_time: '2024-11-14 09:00:00',
            end_km: 8612,
            end_time: '2024-11-14 15:30:00',
            status: 'completed',
            created_by: 2,
            created_at: '2024-11-14 08:30:00',
            load_details: [
                { provider: 'HP', kg: '19', type: 'empty', quantity: 50 }
            ],
            filled_details: [
                { provider: 'HP', kg: '19', type: 'filled', quantity: 48 }
            ]
        }
    ],

    deliveries: [
        {
            id: 1,
            trip_id: 1,
            customer_id: 1,
            delivery_date: '2024-11-15',
            delivery_time: '09:45:00',
            // Delivered items
            delivered_items: [
                { provider: 'HP', kg: '19', quantity: 5 },
                { provider: 'HP', kg: '5', quantity: 2 }
            ],
            // Empty collected
            empty_collected: [
                { provider: 'HP', kg: '19', quantity: 5 }
            ],
            // Return collected (damaged)
            return_collected: [
                { provider: 'HP', kg: '19', cylinder_id: 'R001', photo: 'return1.jpg' }
            ],
            // Payment
            payments: [
                { mode: 'cash', amount: 15000, reference: null },
                { mode: 'upi', amount: 5000, reference: 'UPI123456' }
            ],
            photos: ['delivery1.jpg', 'delivery2.jpg'],
            notes: 'Delivered at back entrance',
            latitude: 13.0569,
            longitude: 80.2497,
            created_at: '2024-11-15 09:45:00'
        }
    ],

    inventory: [
        {
            godown_id: 1,
            provider: 'HP',
            kg: '5',
            filled: 150,
            empty: 80,
            in_transit: 10,
            damaged: 5
        },
        {
            godown_id: 1,
            provider: 'HP',
            kg: '19',
            filled: 300,
            empty: 120,
            in_transit: 20,
            damaged: 8
        },
        {
            godown_id: 1,
            provider: 'HP',
            kg: '35',
            filled: 200,
            empty: 90,
            in_transit: 15,
            damaged: 3
        },
        {
            godown_id: 1,
            provider: 'HP',
            kg: '47.5',
            filled: 100,
            empty: 50,
            in_transit: 10,
            damaged: 2
        },
        {
            godown_id: 1,
            provider: 'Indane',
            kg: '19',
            filled: 250,
            empty: 100,
            in_transit: 10,
            damaged: 5
        }
    ]
};

// Initialize localStorage with mock data
function initializeMockData() {
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
    if (!localStorage.getItem('hpgas_drivers')) {
        localStorage.setItem('hpgas_drivers', JSON.stringify(mockData.drivers));
    }
    if (!localStorage.getItem('hpgas_loadmen')) {
        localStorage.setItem('hpgas_loadmen', JSON.stringify(mockData.loadmen));
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

// Helper functions to get data
function getUsers() {
    return JSON.parse(localStorage.getItem('hpgas_users')) || [];
}

function getGodowns() {
    return JSON.parse(localStorage.getItem('hpgas_godowns')) || [];
}

function getCustomers() {
    return JSON.parse(localStorage.getItem('hpgas_customers')) || [];
}

function getVehicles() {
    return JSON.parse(localStorage.getItem('hpgas_vehicles')) || [];
}

function getDrivers() {
    return JSON.parse(localStorage.getItem('hpgas_drivers')) || [];
}

function getLoadmen() {
    return JSON.parse(localStorage.getItem('hpgas_loadmen')) || [];
}

function getFillingStations() {
    return JSON.parse(localStorage.getItem('hpgas_filling_stations')) || [];
}

function getTrips() {
    return JSON.parse(localStorage.getItem('hpgas_trips')) || [];
}

function getDeliveries() {
    return JSON.parse(localStorage.getItem('hpgas_deliveries')) || [];
}

function getInventory() {
    return JSON.parse(localStorage.getItem('hpgas_inventory')) || [];
}

// Helper to save data
function saveUsers(users) {
    localStorage.setItem('hpgas_users', JSON.stringify(users));
}

function saveTrips(trips) {
    localStorage.setItem('hpgas_trips', JSON.stringify(trips));
}

function saveDeliveries(deliveries) {
    localStorage.setItem('hpgas_deliveries', JSON.stringify(deliveries));
}

function saveInventory(inventory) {
    localStorage.setItem('hpgas_inventory', JSON.stringify(inventory));
}

// Initialize on load
initializeMockData();