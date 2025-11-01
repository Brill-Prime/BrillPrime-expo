export interface CartItem {
    commodityId: string;
    quantity: number;
    price: number;
    name: string;
    image?: string;
}

export interface OrderPayload {
    items: {
        productId: number;
        quantity: number;
        price: number;
    }[];
    deliveryAddressId: number;
    paymentMethodId: number;
    notes?: string;
}