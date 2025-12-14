// Dữ liệu mẫu cho thẻ sản phẩm
export function loadSampleProductCard() {
    banners = [
        {
            id: 1,
            title: "Ưu đãi Giáng Sinh 2024",
            subtitle: "Giảm giá lên đến 20% cho tất cả dịch vụ",
            description: "Chào đón mùa Giáng Sinh với những ưu đãi hấp dẫn nhất trong năm",
            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&h=600&fit=crop",
            buttonText: "Đặt lịch ngay",
            buttonLink: "/booking",
            backgroundColor: "#c41e3a",
            textColor: "#ffffff"
        },
        {
            id: 2,
            title: "Elora Spa & Massage Premium",
            subtitle: "Trải nghiệm dịch vụ 5 sao với không gian sang trọng",
            description: "Thư giãn hoàn toàn với các liệu trình massage chuyên nghiệp",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop",
            buttonText: "Khám phá ngay",
            buttonLink: "/products",
            backgroundColor: "#2c5530",
            textColor: "#ffffff"
        }
    ];

    products = [
        {
            id: 1,
            name: "Massage Thư Giãn Toàn Thân",
            price: 300000,
            originalPrice: 350000,
            discount: 14,
            image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
            rating: 4.8,
            reviewCount: 127,
            trending: true,
            bestseller: true,
            duration: 60
        },
        {
            id: 2,
            name: "Chăm Sóc Da Mặt Cơ Bản",
            price: 250000,
            originalPrice: 300000,
            discount: 17,
            image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
            rating: 4.6,
            reviewCount: 89,
            trending: true,
            bestseller: false,
            duration: 45
        },
        {
            id: 3,
            name: "Tẩy Tế Bào Chết Toàn Thân",
            price: 400000,
            originalPrice: 450000,
            discount: 11,
            image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=300&fit=crop",
            rating: 4.7,
            reviewCount: 156,
            trending: false,
            bestseller: true,
            duration: 90
        }
    ];

    return { banners, products };
}


// Fallback sample services
export function loadSampleServices() {
    return {
        'massage-toan-than': {
            id: 'massage-toan-than',
            name: 'Massage Thư Giãn Toàn Thân',
            price: '850.000đ',
            priceValue: 850000,
            duration: '90 phút',
            description: 'Massage toàn thân giúp thư giãn cơ bắp, giảm căng thẳng và cải thiện tuần hoàn máu.',
            image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&h=200&fit=crop'
        },
        'cham-soc-da-mat': {
            id: 'cham-soc-da-mat',
            name: 'Chăm Sóc Da Mặt',
            price: '650.000đ',
            priceValue: 650000,
            duration: '75 phút',
            description: 'Làm sạch sâu, tẩy tế bào chết và dưỡng ẩm cho da mặt tươi sáng.',
            image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=200&fit=crop'
        },
        'tay-te-bao-chet': {
            id: 'tay-te-bao-chet',
            name: 'Tẩy Tế Bào Chết',
            price: '450.000đ',
            priceValue: 450000,
            duration: '60 phút',
            description: 'Loại bỏ tế bào chết, làm mịn và mềm mại làn da toàn thân.',
            image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=300&h=200&fit=crop'
        }
    };
}