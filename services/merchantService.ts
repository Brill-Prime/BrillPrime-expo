// Merchant service for BrillPrime app

import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://api.brillprime.com';

export interface Merchant {
	id: string;
	name: string;
	description?: string;
	logoUrl?: string;
	// Add more fields as needed
}

// Fetch all merchants
export const getMerchants = async (): Promise<Merchant[]> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/merchants`);
		return response.data;
	} catch (error) {
		handleAxiosError(error);
		return [];
	}
};

// Fetch a merchant by ID
export const getMerchantById = async (id: string): Promise<Merchant | null> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/merchants/${id}`);
		return response.data;
	} catch (error) {
		handleAxiosError(error);
		return null;
	}
};

// Create a new merchant
export const createMerchant = async (merchant: Omit<Merchant, 'id'>): Promise<Merchant | null> => {
	try {
		const response = await axios.post(`${API_BASE_URL}/merchants`, merchant);
		return response.data;
	} catch (error) {
		handleAxiosError(error);
		return null;
	}
};

// Update an existing merchant
export const updateMerchant = async (id: string, merchant: Partial<Omit<Merchant, 'id'>>): Promise<Merchant | null> => {
	try {
		const response = await axios.put(`${API_BASE_URL}/merchants/${id}`, merchant);
		return response.data;
	} catch (error) {
		handleAxiosError(error);
		return null;
	}
};

// Delete a merchant
export const deleteMerchant = async (id: string): Promise<boolean> => {
	try {
		await axios.delete(`${API_BASE_URL}/merchants/${id}`);
		return true;
	} catch (error) {
		handleAxiosError(error);
		return false;
	}
};

// Helper for error handling
function handleAxiosError(error: unknown) {
	if (axios.isAxiosError(error)) {
		// You can add more sophisticated error handling/logging here
		console.error('API Error:', error.response?.data || error.message);
	} else {
		console.error('Unexpected Error:', error);
	}
}
