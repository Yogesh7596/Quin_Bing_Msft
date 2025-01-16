export interface User {
	username: string;
	email: string;
	role: string;
	file_uploaded: string;
	query_count: number;
	credit_assigned: number;
	credit_used: number;
	credit_revoked: number;
	balance: number;
	transactions: any;
}