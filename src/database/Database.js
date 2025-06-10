export const COLOURS = {
    white: '#ffffff',
    black: '#000000',
    green: '#00AC76',
    red: '#C04345',
    blue: '#0043F9',
    darkBlue: '#7978B5',
    backgroundLight: '#F0F0F3',
    backgroundMedium: '#B9B9B9',
    backgroundDark: '#777777',
    darkBackground: '#121212',
    darkGrey: "#636363",
    colorOne: "#ff3b07",
    colorTwo: "#4165af",
    

    buttons: '#ff8c52',
    gery1: '#43484d',
    gery2: '#5e6977',
    grey3: '#86939e',
    grey4: '#bdc6cf',
    grey5: '#F5F5F5',
    CardComment: '#86939e',
    CardBackground: 'white',
    statusbar: '#ff8c52',
    heacherText: 'white',
    lightgreen: '#66DF48'
};

export const parameters = {
    headerHeight: 40,
    styledButton: {
        backgroundColor: '#ff8c52',
        alignContent: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderwidth: 1,
        borderColor: '#FfBc52',
        height: 50,
        paddingHorizontal: 20,
        width: '100%',
    },
    buttonTitle: {
        color: 'white',
        fontsize: 20,
        fontweight: 'bold',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -3,
    }
}

export const Items = [{
        id: 1,
        category: 'product',
        productName: 'MI Super Bass Bluetooth Wireless Headphones',
        productPrice: 1799,
        description: 'Up to 20 hours battery life | Super powerful Bass | 40mm dynamic driver | Pressure less ear muffs | Bluetooth 5.0 | Voice control',
        isOff: true,
        offPercentage: 10,
        productImage: require('../database/images/products/Mi1.png'),
        isAvailable: true,
        productImageList: [
            require('../database/images/products/Mi1.png'),
            require('../database/images/products/Mi2.png'),
            require('../database/images/products/Mi3.png'),
        ],
    },
    {
        id: 2,
        category: 'product',
        productName: 'boAt Rockerz 450 Bluetooth Headphone',
        productPrice: 1499,
        description: 'boAt Rockerz 450 M is an on-ear wireless headset that has been ergonomically designed to meet the needs of music lovers.',
        isOff: false,
        productImage: require('../database/images/products/boat1.png'),
        isAvailable: true,
        productImageList: [
            require('../database/images/products/boat1.png'),
            require('../database/images/products/boat2.png'),
            require('../database/images/products/boat3.png'),
        ],
    },
    {
        id: 3,
        category: 'accessory',
        productName: 'boAt Airdopes 441',
        productPrice: 1999,
        description: 'Bluetooth: It has Bluetooth v5.0 with a range of 10m and is compatible with Android & iOS',
        isOff: true,
        offPercentage: 18,
        productImage: require('../database/images/accessories/boatairpods1.png'),
        isAvailable: true,
        productImageList: [
            require('../database/images/accessories/boatairpods1.png'),
            require('../database/images/accessories/boatairpods2.png'),
            require('../database/images/accessories/boatairpods3.png'),
        ],
    },
    {
        id: 4,
        category: 'accessory',
        productName: 'boAt Bassheads 242',
        productPrice: 399,
        description: 'Fly into your workouts with precise tones that inspire and energize your system with its HD sound, all the time.',
        isOff: false,
        productImage: require('../database/images/accessories/boatbassheads1.png'),
        isAvailable: true,
        productImageList: [
            require('../database/images/accessories/boatbassheads1.png'),
            require('../database/images/accessories/boatbassheads2.png'),
            require('../database/images/accessories/boatbassheads3.png'),
        ],
    },
    {
        id: 5,
        category: 'accessory',
        productName: 'boAt Rockerz 255 Pro+',
        productPrice: 1499,
        description: 'The unbeatable boAt signature sound shines through no matter what are you playing courtesy its 10mm drivers.',
        isOff: false,
        productImage: require('../database/images/accessories/boatrockerz1.png'),
        isAvailable: false,
        productImageList: [
            require('../database/images/accessories/boatrockerz1.png'),
            require('../database/images/accessories/boatrockerz2.png'),
            require('../database/images/accessories/boatrockerz3.png'),
        ],
    },
    {
        id: 6,
        category: 'accessory',
        productName: 'Boult Audio AirBass Propods TWS',
        productPrice: 1299,
        description: 'One Touch Control & Voice Assistant: With one multifunction button, you can play/pause, previous/next track and answer/hang-up calls.Voice assistant function lets you access siri/Google Assistant',
        isOff: false,
        productImage: require('../database/images/accessories/boultairbass1.png'),
        isAvailable: true,
        productImageList: [
            require('../database/images/accessories/boultairbass1.png'),
            require('../database/images/accessories/boultairbass2.png'),
            require('../database/images/accessories/boultairbass3.png'),
        ],
    },
];

export const filterData = [{
    id: "2",
    name: "Chien",
    image: require("../assets/categories/dog.jpg"),
},
{
    id: "3",
    name: "Chat",
    image: require("../assets/categories/cat.jpg"),
},
{
    id: "184",
    name: "Lapin",
    image: require("../assets/categories/rabbit.jpg"),
},
{
    id: "21",
    name: "Poisson",
    image: require("../assets/categories/fish.jpg"),
},
{
    id: "31",
    name: "Reptile",
    image: require("../assets/categories/reptile.jpg"),
},
{
    id: "20",
    name: "Oiseau",
    image: require("../assets/categories/bird.jpg"),
}
]

export const restauratsData = [{
    restaurantName: "Mc Donalds",
    farAway: "21.2",
    businessAddress: "39 Lot bayti sakane, Salé",
    images: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWNnwOqVtB75tjI45ZZeCal03KkzfBIElN_w&usqp=CAU",
    averageReview: 4.9,
    numberOfReview: 272,
    coordinates: {
        lat: -26.188856,
        lng: 28.246325
    },
    discount: 10,
    deliveryTime: 15,
    collectTime: 5,
    foodType: "Burgers, Wraps, MilkShakes...",
    productData: [{
            name: "Hand cut chips",
            price: 29.50,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwINXaUi93R1B0n6Wz2OP_21Vs_9avXoBoRQ&usqp=CAU"
        },
        {
            name: "Big Mac",
            price: 50.80,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIk88M02avmnaARDt5FXb1kOgTw9cXZazx-w&usqp=CAU"
        },
        {
            name: "Chiken Burger",
            price: 70,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSO0dwaTX3LaoItpuP6TQEz9u-yZWebikIINQ&usqp=CAU"
        },
    ],
    id: 0
},
{
    restaurantName: "KFC",
    farAway: "12.7",
    businessAddress: "94 Adam Street Tabriket, Salé",
    images: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuZMxZcLfePzLPvYOqRipX9P1eMMvubSivoA&usqp=CAU",
    averageReview: 4.3,
    numberOfReview: 302,
    coordinates: {
        lat: -26.188856,
        lng: 24.246325
    },
    discount: 20,
    deliveryTime: 30,
    collectTime: 10,
    foodType: "Chicken, Chicken Wings...",
    productData: [{
            name: "Hand cut chips",
            price: 29.50,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTES0i6wWXL54mmW2XME7ky2DqllfGFnU95UA&usqp=CAU"
        },
        {
            name: "Big Mac",
            price: 50.80,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtXPFfuJz2t4AE_IOPk4UFinIshiqjvYUxbg&usqp=CAU"
        },
        {
            name: "Chiken Burger",
            price: 70,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRD1ffne7Wv0ME_B9p8591tjHynLpCXmabpXA&usqp=CAU"
        },
    ],
    id: 1
},
{
    restaurantName: "Roman Pizza",
    farAway: "5",
    businessAddress: "19 Med5 , Rabat",
    images: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6etN5PN9mt1mEev4ysisVMx6SMZ6tdrT5CA&usqp=CAU",
    averageReview: 3.6,
    numberOfReview: 650,
    coordinates: {
        lat: -21.188856,
        lng: 29.246325
    },
    discount: 43,
    deliveryTime: 35,
    collectTime: 25,
    foodType: "Chicken Pizza, Vegetarian pizza...",
    productData: [{
            name: "Hand cut chips",
            price: 29.50,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSA7oYqe6y0WufEH1de4Bd-vdJLDOXKdzZnzQ&usqp=CAU"
        },
        {
            name: "Big Mac",
            price: 50.80,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU5c0z2ELyVLboz1Y4gtNF4T92INGeOJh0eQ&usqp=CAU"
        },
        {
            name: "Chiken Burger",
            price: 70,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhEZN8aaDIxgXTdMY3u58OQCzYG88Ok0Wi1w&usqp=CAU"
        },
    ],
    id: 2
},
{
    restaurantName: "Steers",
    farAway: "5",
    businessAddress: "12 Yamama Street, Rabat",
    images: "https://gagasiworld.co.za/wp-content/uploads/2021/11/10015712-STEERS-GOT-CHEESE-RADIO-DIGITAL-GAGASI-FM-1200X900.jpg",
    averageReview: 4.7,
    numberOfReview: 1245,
    coordinates: {
        lat: -26.188856,
        lng: 24.246325
    },
    discount: 12,
    deliveryTime: 25,
    collectTime: 15,
    foodType: "Flame grilled beef Burgers",
    productData: [{
            name: "Hand cut chips",
            price: 29.50,
            image: "https://media-cdn.tripadvisor.com/media/photo-s/1a/30/7f/f2/photo0jpg.jpg"
        },
        {
            name: "Big Mac",
            price: 50.80,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkiHNdpNubN_pg5mvNHAR4kOYd-3XcLbn4BXRrQj92ZRjCHpvAY66i5oVYiWi03j1gQIg&usqp=CAU"
        },
        {
            name: "Chiken Burger",
            price: 70,
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvB6iWYIKMs_cedrGQW7hZfYccS_rVQyYXkDVOEw8_Q7GlADnGvHdqTMeL62O2fEf7GcE&usqp=CAU"
        },
    ],
    id: 3
}
]
